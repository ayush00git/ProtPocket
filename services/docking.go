package services

import (
	"bytes"
	"context"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/ProtPocket/models"
)

const (
	dockPipelineTimeout = 10 * time.Minute
	prepStepTimeout     = 5 * time.Minute
)

// DockingResult holds the outcome of an AutoDock Vina run after Meeko/OpenBabel preparation.
type DockingResult struct {
	JobID           string  `json:"job_id"`
	PocketID        int     `json:"pocket_id"`
	BindingAffinity float64 `json:"binding_affinity"`
	PosePDBQT       string  `json:"pose_pdbqt"`
	PosePDB         string  `json:"pose_pdb"`
	Status          string  `json:"status"`
	Error           string  `json:"error,omitempty"`
}

// RunDocking prepares receptor and ligand, runs Vina in the pocket box, and converts the best pose to PDB.
func RunDocking(ctx context.Context, jobID string, pocket models.Pocket, ligand models.Fragment, proteinPDBPath string) (DockingResult, error) {
	workDir, err := os.MkdirTemp("", "dock-"+jobID+"-*")
	if err != nil {
		return DockingResult{}, fmt.Errorf("RunDocking: mkdir: %w", err)
	}
	pipelineCtx, cancel := context.WithTimeout(ctx, dockPipelineTimeout)
	defer cancel()

	var cleanupDir = true
	defer func() {
		if cleanupDir {
			_ = os.RemoveAll(workDir)
		}
	}()

	recPDBQT, err := prepareReceptor(pipelineCtx, proteinPDBPath, workDir)
	if err != nil {
		return DockingResult{}, fmt.Errorf("RunDocking: %w", err)
	}

	ligPDB, err := smilesToPDB(pipelineCtx, ligand.SMILES, workDir)
	if err != nil {
		return DockingResult{}, fmt.Errorf("RunDocking: %w", err)
	}

	ligPDBQT, err := prepareLigand(pipelineCtx, ligPDB, workDir)
	if err != nil {
		return DockingResult{}, fmt.Errorf("RunDocking: %w", err)
	}

	outPDBQT := filepath.Join(workDir, "posed.pdbqt")
	vinaOut, err := runVina(pipelineCtx, recPDBQT, ligPDBQT, pocket, outPDBQT)
	if err != nil {
		return DockingResult{}, fmt.Errorf("RunDocking: %w", err)
	}

	affinity, err := parseVinaBestAffinity(vinaOut)
	if err != nil {
		return DockingResult{}, fmt.Errorf("parse vina affinity: %w", err)
	}

	outPDB := filepath.Join(workDir, "posed.pdb")
	if err := pdbqtToPDB(pipelineCtx, outPDBQT, outPDB); err != nil {
		return DockingResult{}, fmt.Errorf("RunDocking: %w", err)
	}

	pdbqtBytes, err := os.ReadFile(outPDBQT)
	if err != nil {
		return DockingResult{}, fmt.Errorf("read pose pdbqt: %w", err)
	}
	pdbBytes, err := os.ReadFile(outPDB)
	if err != nil {
		return DockingResult{}, fmt.Errorf("read pose pdb: %w", err)
	}

	cleanupDir = false
	return DockingResult{
		JobID:           jobID,
		PocketID:        pocket.PocketID,
		BindingAffinity: affinity,
		PosePDBQT:       string(pdbqtBytes),
		PosePDB:         string(pdbBytes),
		Status:          "done",
	}, nil
}

// prepareReceptor runs mk_prepare_receptor.py to produce a PDBQT receptor in workDir.
func prepareReceptor(ctx context.Context, pdbPath, workDir string) (pdbqtPath string, err error) {
	ctx, cancel := context.WithTimeout(ctx, prepStepTimeout)
	defer cancel()

	out := filepath.Join(workDir, "receptor.pdbqt")
	cmd := exec.CommandContext(ctx, "mk_prepare_receptor.py", "-i", pdbPath, "-o", out)
	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr
	if err := cmd.Run(); err != nil {
		return "", fmt.Errorf("prepareReceptor: %w (stderr: %s)", err, strings.TrimSpace(stderr.String()))
	}
	if _, statErr := os.Stat(out); statErr != nil {
		return "", fmt.Errorf("prepareReceptor: output missing at %s: %w", out, statErr)
	}
	return out, nil
}

// smilesToPDB converts a SMILES string to a 3D PDB file using Open Babel.
func smilesToPDB(ctx context.Context, smiles, workDir string) (pdbPath string, err error) {
	ctx, cancel := context.WithTimeout(ctx, prepStepTimeout)
	defer cancel()

	out := filepath.Join(workDir, "ligand.pdb")
	arg := "-:" + smiles
	cmd := exec.CommandContext(ctx, "obabel", arg, "-O", out, "--gen3d")
	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr
	cmd.Dir = workDir
	if err := cmd.Run(); err != nil {
		return "", fmt.Errorf("smilesToPDB: %w (stderr: %s)", err, strings.TrimSpace(stderr.String()))
	}
	if _, statErr := os.Stat(out); statErr != nil {
		return "", fmt.Errorf("smilesToPDB: output missing at %s: %w", out, statErr)
	}
	return out, nil
}

// prepareLigand runs mk_prepare_ligand.py on a PDB ligand.
func prepareLigand(ctx context.Context, pdbPath, workDir string) (pdbqtPath string, err error) {
	ctx, cancel := context.WithTimeout(ctx, prepStepTimeout)
	defer cancel()

	out := filepath.Join(workDir, "ligand.pdbqt")
	cmd := exec.CommandContext(ctx, "mk_prepare_ligand.py", "-i", pdbPath, "-o", out)
	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr
	if err := cmd.Run(); err != nil {
		return "", fmt.Errorf("prepareLigand: %w (stderr: %s)", err, strings.TrimSpace(stderr.String()))
	}
	if _, statErr := os.Stat(out); statErr != nil {
		return "", fmt.Errorf("prepareLigand: output missing at %s: %w", out, statErr)
	}
	return out, nil
}

// computeBoxSize maps pocket volume to an AutoDock Vina box edge (Å): 20 if volume < 300, 25 if < 800, else 30.
func computeBoxSize(volume float64) float64 {
	switch {
	case volume < 300:
		return 20
	case volume < 800:
		return 25
	default:
		return 30
	}
}

// runVina executes AutoDock Vina with a cubic box centered on the pocket.
func runVina(ctx context.Context, receptorPDBQT, ligandPDBQT string, pocket models.Pocket, outputPDBQT string) (stdout string, err error) {
	box := computeBoxSize(pocket.Volume)
	cx, cy, cz := pocket.Center[0], pocket.Center[1], pocket.Center[2]

	cmd := exec.CommandContext(ctx, "vina",
		"--receptor", receptorPDBQT,
		"--ligand", ligandPDBQT,
		"--center_x", formatCoord(cx),
		"--center_y", formatCoord(cy),
		"--center_z", formatCoord(cz),
		"--size_x", formatCoord(box),
		"--size_y", formatCoord(box),
		"--size_z", formatCoord(box),
		"--out", outputPDBQT,
	)
	var outBuf, stderr bytes.Buffer
	cmd.Stdout = &outBuf
	cmd.Stderr = &stderr

	runErr := cmd.Run()
	outStr := outBuf.String()
	if runErr != nil {
		return outStr, fmt.Errorf("runVina: %w (stderr: %s)", runErr, strings.TrimSpace(stderr.String()))
	}
	if _, statErr := os.Stat(outputPDBQT); statErr != nil {
		return outStr, fmt.Errorf("runVina: output pdbqt missing at %s: %w", outputPDBQT, statErr)
	}
	return outStr, nil
}

// formatCoord renders a floating-point coordinate for Vina command-line flags.
func formatCoord(f float64) string {
	return strconv.FormatFloat(f, 'f', 3, 64)
}

// pdbqtToPDB converts PDBQT to PDB with Open Babel.
func pdbqtToPDB(ctx context.Context, pdbqtPath, outPath string) error {
	ctx, cancel := context.WithTimeout(ctx, prepStepTimeout)
	defer cancel()

	cmd := exec.CommandContext(ctx, "obabel", pdbqtPath, "-O", outPath)
	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr
	if err := cmd.Run(); err != nil {
		return fmt.Errorf("pdbqtToPDB: %w (stderr: %s)", err, strings.TrimSpace(stderr.String()))
	}
	if _, err := os.Stat(outPath); err != nil {
		return fmt.Errorf("pdbqtToPDB: output missing at %s: %w", outPath, err)
	}
	return nil
}

// vinaAffinityRow matches the first docking mode line in Vina stdout (mode 1, affinity column).
var vinaAffinityRow = regexp.MustCompile(`(?m)^\s*1\s+(-?\d+(?:\.\d+)?)`)

// parseVinaBestAffinity extracts the first-mode affinity (kcal/mol) from Vina's stdout table.
func parseVinaBestAffinity(stdout string) (float64, error) {
	m := vinaAffinityRow.FindStringSubmatch(stdout)
	if len(m) < 2 {
		return 0, fmt.Errorf("no affinity row found in vina output")
	}
	aff, err := strconv.ParseFloat(m[1], 64)
	if err != nil {
		return 0, fmt.Errorf("parse affinity %q: %w", m[1], err)
	}
	return aff, nil
}
