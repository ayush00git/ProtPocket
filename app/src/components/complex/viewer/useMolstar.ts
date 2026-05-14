import { useRef, useEffect, useState, useCallback } from 'react';
import { DefaultPluginUISpec } from 'molstar/lib/mol-plugin-ui/spec';
import { createPluginUI } from 'molstar/lib/mol-plugin-ui';
import { PluginConfig } from 'molstar/lib/mol-plugin/config';
import { Color } from 'molstar/lib/mol-util/color';
import { createRoot } from 'react-dom/client';
import { StructureSelection } from 'molstar/lib/mol-model/structure';
import { Script } from 'molstar/lib/mol-script/script';

import 'molstar/lib/mol-plugin-ui/skin/dark.scss';

import type { Conformation } from '../../../types';

interface UseMolstarOptions {
  structureUrl?: string;
  label?: string;
  autoLoad?: boolean;
  highlightIndices?: number[] | null;
  theme?: string;
  representation?: string;
  conformations?: Conformation[] | null;
  activeMode?: number | null;
  hideControls?: boolean;
}

// Extend HTMLElement to hold React root
interface HTMLElementWithRoot extends HTMLElement {
  __reactRoot?: ReturnType<typeof createRoot>;
}

/**
 * useMolstar — React hook that encapsulates the Mol* viewer lifecycle.
 *
 * Handles initialization, structure loading from .cif URL, pLDDT coloring,
 * and cleanup on unmount. No Mol* code should exist outside this hook.
 */
export function useMolstar({
  structureUrl,
  label = '',
  autoLoad = true,
  highlightIndices = null,
  theme = 'light',
  representation = 'cartoon',
  conformations = null,
  activeMode = null,
  hideControls = false,
}: UseMolstarOptions) {
  const containerRef = useRef<HTMLElementWithRoot | null>(null);
  const pluginRef = useRef<any>(null);
  const initRef = useRef(false);
  const pocketActiveRef = useRef(false); // Track if a pocket highlight is active
  const poseStructureRefs = useRef<Map<number, any>>(new Map());
  const activeModeRef = useRef<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize Mol* plugin
  useEffect(() => {
    if (!containerRef.current || initRef.current) return;
    initRef.current = true;

    let disposed = false;

    const init = async () => {
      try {
        const spec = DefaultPluginUISpec();

        // Hide bulky sidebars but keep the tooltips/sequence overlays active
        spec.layout = {
          initial: {
            isExpanded: false,
            showControls: !hideControls,
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
          target: containerRef.current as HTMLElement,
          spec,
          render: (component: any, target: any) => {
            const el = target as HTMLElementWithRoot;
            let root = el.__reactRoot;
            if (!root) {
              root = createRoot(el);
              el.__reactRoot = root;
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
      } catch (err: unknown) {
        console.error('[useMolstar] init failed:', err);
        if (!disposed) {
          setError(`Viewer init failed: ${err instanceof Error ? err.message : String(err)}`);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reload structure when URL changes (after init)
  useEffect(() => {
    if (!pluginRef.current || !structureUrl || !autoLoad) return;
    // Only reload if plugin is already initialized
    if (!pluginRef.current.isInitialized) return;

    loadStructure(pluginRef.current, structureUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Update representation when it changes
  useEffect(() => {
    if (!pluginRef.current || !pluginRef.current.isInitialized || isLoading) return;
    updateRepresentationStyle(pluginRef.current, representation);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [representation, isLoading]);

  /**
   * Update the representation type for all structures.
   */
  const updateRepresentationStyle = async (plugin: any, type: string) => {
    try {
      const { structures } = plugin.managers.structure.hierarchy.current;
      if (!structures || structures.length === 0) return;

      const mgr = plugin.managers.structure.component;

      for (const s of structures) {
        if (!s.components) continue;

        for (const comp of s.components) {
          if (!comp.representations || comp.representations.length === 0) continue;

          // Remove all existing representations from this component
          await mgr.removeRepresentations([comp]);

          // Add new representation with the desired type
          await mgr.addRepresentation([comp], type);
        }
      }

      // Re-apply pLDDT coloring after swapping representation type
      await applyPlddtColoring(plugin);
    } catch (err) {
      console.warn('[useMolstar] updateRepresentationStyle failed:', err);
    }
  };

  /**
   * Load a .cif file and apply pLDDT confidence coloring.
   */
  const loadStructure = async (plugin: any, url: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // Clear any existing structures
      await plugin.clear();
      try {
        poseStructureRefs.current.clear();
        activeModeRef.current = null;
      } catch (err) {
        console.warn('[useMolstar] clear failed:', err);
      }

      // Download the CIF file
      let data: any;
      try {
        data = await plugin.builders.data.download(
          { url, isBinary: false, label },
          { state: { isGhost: true } }
        );
      } catch (dlErr: unknown) {
        throw new Error(`Download failed for ${url}: ${dlErr instanceof Error ? dlErr.message : String(dlErr)}`);
      }

      // Detect format from URL
      const isPdb = url.toLowerCase().endsWith('.pdb');
      const format = isPdb ? 'pdb' : 'mmcif';

      // Parse structure data and build trajectory
      let trajectory: any;
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
      await applyPlddtColoring(plugin);

      // Apply initial representation if not default (cartoon)
      if (representation !== 'cartoon') {
        await updateRepresentationStyle(plugin, representation);
      }

      // Frame the camera
      plugin.managers.camera.reset();

    } catch (err: unknown) {
      console.error(`[useMolstar] Load failed for ${url}:`, err);
      setError(`Failed to load: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Remove all preloaded pose structures. Receptor unaffected.
   */
  async function clearAllPoses() {
    const plugin = pluginRef.current;
    if (!plugin) return;
    for (const structRef of poseStructureRefs.current.values()) {
      await plugin.managers.structure.hierarchy.remove([structRef]);
    }
    poseStructureRefs.current.clear();
    activeModeRef.current = null;
  }

  /**
   * Preload all conformations as hidden Mol* structures.
   * Show only the one matching initialMode. Receptor always stays visible.
   */
  async function preloadConformations(confs: Conformation[], initialMode?: number) {
    const plugin = pluginRef.current;
    if (!plugin?.isInitialized) return;
    await clearAllPoses();

    for (const conf of confs) {
      const blob = new Blob([conf.pose_pdb], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      try {
        const data = await plugin.builders.data.download(
          { url, isBinary: false, label: `pose_${conf.mode}` },
          { state: { isGhost: false } }
        );
        const trajectory = await plugin.builders.structure.parseTrajectory(data, 'pdb');
        await plugin.builders.structure.hierarchy.applyPreset(
          trajectory,
          'default',
          {
            structure: { name: 'model', params: {} },
            showUnitcell: false,
            representationPreset: 'auto',
          }
        );

        plugin.managers.structure.hierarchy.sync(true);
        const structures = plugin.managers.structure.hierarchy.current.structures;
        const structRef = structures[structures.length - 1];
        if (!structRef) continue;

        const modeColors: Record<number, ReturnType<typeof Color>> = {
          1: Color(0xf97316),
          2: Color(0x8b5cf6),
          3: Color(0x06b6d4),
        };
        const color = modeColors[conf.mode] ?? Color(0x6b7280);

        const mgr = plugin.managers.structure.component;
        if (structRef.components?.length) {
          for (const comp of structRef.components) {
            await mgr.removeRepresentations([comp]);
            await mgr.addRepresentation([comp], 'ball-and-stick');
            await mgr.updateRepresentationsTheme([comp], {
              color: 'uniform',
              colorParams: { value: color },
            });
          }
        }
        poseStructureRefs.current.set(conf.mode, structRef);
      } finally {
        URL.revokeObjectURL(url);
      }
    }

    const mode0 = initialMode ?? confs[0]?.mode;
    const hierarchy = plugin.managers.structure.hierarchy;
    for (const [mode, structRef] of poseStructureRefs.current) {
      const shouldShow = mode === mode0;
      if (structRef) {
        hierarchy.toggleVisibility([structRef], shouldShow ? 'show' : 'hide');
      }
    }
    activeModeRef.current = mode0;
  }

  /**
   * Switch visible pose to `mode`. Hide previous. Does not reset camera.
   */
  async function showConformation(mode: number) {
    const plugin = pluginRef.current;
    if (!plugin) return;
    const hierarchy = plugin.managers.structure.hierarchy;
    for (const [m, structRef] of poseStructureRefs.current) {
      const shouldShow = m === mode;
      if (structRef) {
        hierarchy.toggleVisibility([structRef], shouldShow ? 'show' : 'hide');
      }
    }
    activeModeRef.current = mode;
  }

  const resetCamera = useCallback(() => {
    if (pluginRef.current?.managers?.camera) {
      pluginRef.current.managers.camera.reset();
    }
  }, []);

  /**
   * Highlight specific residues in the 3D viewer (pocket visualization).
   * Uses Mol*'s native selection manager to highlight and focus the pocket.
   */
  const highlightPocket = useCallback(async (residueIndices: number[]) => {
    const plugin = pluginRef.current;
    if (!plugin || !residueIndices || residueIndices.length === 0) return;

    try {
      const structures = plugin.managers.structure.hierarchy.current.structures;
      if (!structures || structures.length === 0) return;

      // Mark pocket as active so clicks don't clear it
      pocketActiveRef.current = true;

      // Clear previous selections
      plugin.managers.interactivity.lociSelects.deselectAll();

      let targetLoci: any = null;

      for (const s of structures) {
        if (!s.cell?.obj?.data) continue;
        const structure = s.cell.obj.data;

        // Create a selection matching either label_seq_id (CIF) or auth_seq_id (PDB)
        const sel = Script.getStructureSelection(
          (Q: any) => Q.struct.generator.atomGroups({
            'residue-test': Q.core.logic.or(
              residueIndices.flatMap((idx: number) => [
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
  }, [highlightIndices, isLoading, highlightPocket, clearPocketHighlight, conformations, activeMode]);

  // When conformations array is newly populated: preload all
  useEffect(() => {
    const plugin = pluginRef.current;
    if (!plugin || isLoading) return;
    if (conformations?.length) {
      const initial = activeMode ?? conformations[0]?.mode;
      preloadConformations(conformations, initial).catch((e) =>
        console.warn('[useMolstar] preloadConformations failed:', e)
      );
    } else {
      clearAllPoses().catch((e) => console.warn('[useMolstar] clearAllPoses failed:', e));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conformations, isLoading]);

  // When activeMode changes and poses are already loaded: just switch visibility
  useEffect(() => {
    const plugin = pluginRef.current;
    if (!plugin || activeMode == null || !poseStructureRefs.current.size) return;
    if (activeMode === activeModeRef.current) return;
    showConformation(activeMode).catch((e) => console.warn('[useMolstar] showConformation failed:', e));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeMode]);

  return {
    containerRef,
    isLoading,
    error,
    resetCamera,
    highlightPocket,
    clearPocketHighlight,
    preloadConformations,
    showConformation,
    clearAllPoses,
  };
}

/**
 * Apply pLDDT confidence coloring to all representations.
 */
async function applyPlddtColoring(plugin: any) {
  const themeNames = ['uncertainty', 'plddt-confidence', 'b-factor'];

  const registry = plugin.representation.structure.themes.colorThemeRegistry;
  let themeName: string | null = null;
  const availableThemes = registry._list || [];

  for (const name of themeNames) {
    if (availableThemes.some((t: any) => t.name === name)) {
      themeName = name;
      break;
    }
  }

  if (!themeName) {
    console.warn('[useMolstar] No pLDDT color theme found. Available:', availableThemes.map((t: any) => t.name));
    return;
  }

  const structures = plugin.managers.structure.hierarchy.current.structures;
  if (!structures) return;

  // Step 1: Apply the uncertainty theme via normal API
  for (const s of structures) {
    if (!s.components) continue;
    const validComponents = s.components.filter((c: any) => c && c.representations);
    if (validComponents.length > 0) {
      try {
        await plugin.managers.structure.component.updateRepresentationsTheme(
          validComponents,
          { color: themeName }
        );
      } catch (e) {
        console.warn('[useMolstar] Failed to apply theme:', e);
      }
    }
  }

  // Step 2: Directly patch representation state cells to flip the color list.
  try {
    const update = plugin.state.data.build();
    let patched = false;

    for (const s of structures) {
      if (!s.components) continue;
      for (const comp of s.components) {
        if (!comp.representations) continue;
        for (const repr of comp.representations) {
          const cell = repr.cell;
          if (!cell?.transform?.params?.colorTheme) continue;
          const ct = cell.transform.params.colorTheme;
          if (ct.name !== 'uncertainty') continue;

          update.to(cell).update((old: any) => {
            if (old.colorTheme?.params?.list?.colors) {
              old.colorTheme.params.list.colors = [...old.colorTheme.params.list.colors].reverse();
            }
          });
          patched = true;
        }
      }
    }

    if (patched) {
      await update.commit();
    }
  } catch (e) {
    console.warn('[useMolstar] Failed to patch color list for pLDDT:', e);
  }
}
