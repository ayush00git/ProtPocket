import { useRef, useEffect, useState, useCallback } from 'react';
import { PluginUIContext } from 'molstar/lib/mol-plugin-ui/context';
import { DefaultPluginUISpec } from 'molstar/lib/mol-plugin-ui/spec';
import { createPluginUI } from 'molstar/lib/mol-plugin-ui';
import { PluginBehaviors } from 'molstar/lib/mol-plugin/behavior';
import { PluginConfig } from 'molstar/lib/mol-plugin/config';
import { Color } from 'molstar/lib/mol-util/color';
import { createRoot } from 'react-dom/client';
import { StructureSelection, StructureQuery, StructureProperties } from 'molstar/lib/mol-model/structure';
import { Script } from 'molstar/lib/mol-script/script';
import { MolScriptBuilder as MS } from 'molstar/lib/mol-script/language/builder';
import { Bundle } from 'molstar/lib/mol-model/structure/structure/element/bundle';
import { Overpaint } from 'molstar/lib/mol-theme/overpaint';

import 'molstar/lib/mol-plugin-ui/skin/dark.scss';

/**
 * useMolstar — React hook that encapsulates the Mol* viewer lifecycle.
 *
 * Handles initialization, structure loading from .cif URL, pLDDT coloring,
 * and cleanup on unmount. No Mol* code should exist outside this hook.
 *
 * @param {Object} options
 * @param {string} options.structureUrl — URL to the .cif file
 * @param {string} options.label — label for the structure
 * @param {boolean} options.autoLoad — whether to load immediately (default true)
 * @returns {{ containerRef, isLoading, error, resetCamera }}
 */
export function useMolstar({ structureUrl, label = '', autoLoad = true, highlightIndices = null, theme = 'light' }) {
  const containerRef = useRef(null);
  const pluginRef = useRef(null);
  const initRef = useRef(false);
  const pocketActiveRef = useRef(false); // Track if a pocket highlight is active
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Initialize Mol* plugin
  useEffect(() => {
    if (!containerRef.current || initRef.current) return;
    initRef.current = true;

    let disposed = false;

    const init = async () => {
      try {
        const spec = DefaultPluginUISpec();
        // Mol* shares DefaultQueryRuntimeTable across all plugins; the Accessible
        // Surface Area behavior registers global query symbols on every instance.
        // Multiple viewers (e.g. monomer + dimer) would re-add the same symbols and
        // warn — drop this behavior since the pocket viewer does not need ASA UI.
        spec.behaviors = spec.behaviors.filter(
          (b) => b.transformer !== PluginBehaviors.CustomProps.AccessibleSurfaceArea
        );

        // Hide bulky sidebars but keep the tooltips/sequence overlays active
        spec.layout = {
          initial: {
            isExpanded: false,
            showControls: true,
            regionState: {
              bottom: 'hidden',
              left: 'hidden',
              right: 'hidden',
              top: 'hidden',
            }
          },
        };

        // Set background matching site theme
        spec.canvas3d = {
          renderer: {
            backgroundColor: theme === 'dark' ? Color(0x0a0a0a) : Color(0xffffff),
            selectColor: theme === 'dark' ? Color(0x4ade80) : Color(0x2563eb),
            highlightColor: theme === 'dark' ? Color(0x4ade80) : Color(0x2563eb),
          },
        };

        // Disable unnecessary features for minimal viewer
        spec.config = spec.config || [];
        spec.config.push(
          [PluginConfig.Viewport.ShowExpand, false],
          [PluginConfig.Viewport.ShowSettings, false],
          [PluginConfig.Viewport.ShowAnimation, false],
          [PluginConfig.Viewport.ShowTrajectoryControls, false],
        );

        const plugin = await createPluginUI({
          target: containerRef.current,
          spec,
          render: (component, target) => {
            let root = target.__reactRoot;
            if (!root) {
              root = createRoot(target);
              target.__reactRoot = root;
            }
            root.render(component);
          },
        });

        if (disposed) {
          if (containerRef.current?.__reactRoot) {
            containerRef.current.__reactRoot.unmount();
            delete containerRef.current.__reactRoot;
          }
          plugin.dispose();
          return;
        }

        pluginRef.current = plugin;

        // Prevent click-selection from suppressing hover labels,
        // but skip deselection when a pocket is actively highlighted
        plugin.behaviors.interaction.click.subscribe(() => {
          if (plugin.managers.interactivity && !pocketActiveRef.current) {
            plugin.managers.interactivity.lociSelects.deselectAll();
          }
        });

        // Load structure if URL available
        if (autoLoad && structureUrl) {
          await loadStructure(plugin, structureUrl);
        }
      } catch (err) {
        console.error('[useMolstar] init failed:', err);
        if (!disposed) {
          setError(`Viewer init failed: ${err.message}`);
        }
      }
    };

    init();

    return () => {
      disposed = true;
      if (pluginRef.current) {
        pluginRef.current.dispose();
        pluginRef.current = null;
      }
      if (containerRef.current?.__reactRoot) {
        containerRef.current.__reactRoot.unmount();
        delete containerRef.current.__reactRoot;
      }
      initRef.current = false;
    };
  }, []);

  // Reload structure when URL changes (after init)
  useEffect(() => {
    if (!pluginRef.current || !structureUrl || !autoLoad) return;
    // Only reload if plugin is already initialized
    if (!pluginRef.current.isInitialized) return;

    loadStructure(pluginRef.current, structureUrl);
  }, [structureUrl]);

  // Update background when theme changes
  useEffect(() => {
    if (!pluginRef.current || !pluginRef.current.isInitialized) return;
    
    const bgColor = theme === 'dark' ? Color(0x0a0a0a) : Color(0xffffff);
    const accentColor = theme === 'dark' ? Color(0x4ade80) : Color(0x2563eb);
    
    pluginRef.current.canvas3d?.setProps({
      renderer: {
        backgroundColor: bgColor,
        selectColor: accentColor,
        highlightColor: accentColor,
      }
    });
  }, [theme]);

  /**
   * Load a .cif file and apply pLDDT confidence coloring.
   */
  const loadStructure = async (plugin, url) => {
    setIsLoading(true);
    setError(null);

    try {
      // Clear any existing structures
      await plugin.clear();

      // Download the CIF file
      let data;
      try {
        data = await plugin.builders.data.download(
          { url, isBinary: false, label },
          { state: { isGhost: true } }
        );
      } catch (dlErr) {
        throw new Error(`Download failed for ${url}: ${dlErr.message}`);
      }

      // Detect format from URL
      const isPdb = url.toLowerCase().endsWith('.pdb');
      const format = isPdb ? 'pdb' : 'mmcif';

      // Parse structure data and build trajectory
      let trajectory;
      try {
        trajectory = await plugin.builders.structure.parseTrajectory(data, format);
      } catch (parseErr) {
        console.error('Parse error details:', parseErr);
        throw new Error(`Failed to parse structure data. The URL might be returning an error page or JSON instead of a valid structure file. (format: ${format}, URL: ${url})`);
      }

      // Apply default preset to get structure + representation
      await plugin.builders.structure.hierarchy.applyPreset(
        trajectory,
        'default',
        {
          structure: {
            name: 'model',
            params: {},
          },
          showUnitcell: false,
          representationPreset: 'auto',
        }
      );

      // Apply pLDDT confidence coloring (uncertainty theme)
      // AlphaFold stores pLDDT in the B-factor column.
      // Mol* 'uncertainty' theme maps B-factor → standard 4-color pLDDT scale
      await applyPlddtColoring(plugin);

      // Frame the camera
      plugin.managers.camera.reset();

    } catch (err) {
      console.error(`[useMolstar] Load failed for ${url}:`, err);
      setError(`Failed to load: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const resetCamera = useCallback(() => {
    if (pluginRef.current?.managers?.camera) {
      pluginRef.current.managers.camera.reset();
    }
  }, []);

  /**
   * Highlight specific residues in the 3D viewer (pocket visualization).
   * Uses Mol*'s native selection manager to highlight and focus the pocket.
   */
  const highlightPocket = useCallback(async (residueIndices) => {
    const plugin = pluginRef.current;
    if (!plugin || !residueIndices || residueIndices.length === 0) return;

    try {
      const structures = plugin.managers.structure.hierarchy.current.structures;
      if (!structures || structures.length === 0) return;

      // Mark pocket as active so clicks don't clear it
      pocketActiveRef.current = true;

      // Clear previous selections
      plugin.managers.interactivity.lociSelects.deselectAll();

      let targetLoci = null;

      for (const s of structures) {
        if (!s.cell?.obj?.data) continue;
        const structure = s.cell.obj.data;

        // Create a selection matching either label_seq_id (CIF) or auth_seq_id (PDB)
        const sel = Script.getStructureSelection(
          Q => Q.struct.generator.atomGroups({
            'residue-test': Q.core.logic.or(
              residueIndices.flatMap(idx => [
                Q.core.rel.eq([Q.struct.atomProperty.macromolecular.label_seq_id(), idx]),
                Q.core.rel.eq([Q.struct.atomProperty.macromolecular.auth_seq_id(), idx])
              ])
            ),
          }),
          structure
        );

        const loci = StructureSelection.toLociWithSourceUnits(sel);
        
        // Apply selection to highlight it in the viewer
        plugin.managers.interactivity.lociSelects.select({ loci });
        
        if (loci.elements && loci.elements.length > 0) {
          targetLoci = loci;
        }
      }

      // Focus camera on the highlighted pocket if found
      if (targetLoci) {
        plugin.managers.camera.focusLoci(targetLoci);
      }
    } catch (err) {
      console.warn('[useMolstar] highlightPocket failed:', err);
    }
  }, []);

  /**
   * Clear pocket highlights and restore the camera.
   */
  const clearPocketHighlight = useCallback(async () => {
    const plugin = pluginRef.current;
    if (!plugin) return;

    try {
      pocketActiveRef.current = false;
      plugin.managers.interactivity.lociSelects.deselectAll();
      plugin.managers.camera.reset();
    } catch (err) {
      console.warn('[useMolstar] clearPocketHighlight failed:', err);
    }
  }, []);

  // Synchronize highlights when indices change or structure finished loading
  useEffect(() => {
    if (!pluginRef.current || isLoading) return;
    
    if (highlightIndices && highlightIndices.length > 0) {
      highlightPocket(highlightIndices);
    } else if (pocketActiveRef.current) {
      clearPocketHighlight();
    }
  }, [highlightIndices, isLoading, highlightPocket, clearPocketHighlight]);

  return { containerRef, isLoading, error, resetCamera, highlightPocket, clearPocketHighlight };
}

/**
 * Apply pLDDT confidence coloring to all representations.
 * Tries 'uncertainty' theme first (Mol* built-in for AlphaFold),
 * then falls back to 'plddt-confidence', then 'b-factor'.
 */
async function applyPlddtColoring(plugin) {
  const themeNames = ['uncertainty', 'plddt-confidence', 'b-factor'];

  // Check which themes are available
  const registry = plugin.representation.structure.themes.colorThemeRegistry;
  let themeName = null;

  // registry._list contains elements like { name: 'uncertainty', provider: {...} }
  const availableThemes = registry._list || [];

  for (const name of themeNames) {
    if (availableThemes.some(t => t.name === name)) {
      themeName = name;
      break;
    }
  }

  if (!themeName) {
    console.warn('[useMolstar] No pLDDT color theme found. Available themes:',
      availableThemes.map(t => t.name));
    return;
  }

  // Apply theme to all structure representations
  const structures = plugin.managers.structure.hierarchy.current.structures;
  if (!structures) return;

  for (const s of structures) {
    if (!s.components) continue;
    
    // Only pass components that actually have representations
    const validComponents = s.components.filter(c => c && c.representations);
    
    if (validComponents.length > 0) {
      try {
        await plugin.managers.structure.component.updateRepresentationsTheme(
          validComponents,
          { color: themeName }
        );
      } catch (e) {
        console.warn('[useMolstar] Failed to apply theme to components:', e);
      }
    }
  }
}
