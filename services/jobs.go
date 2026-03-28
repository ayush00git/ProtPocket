package services

import (
	"context"
	"sync"

	"github.com/google/uuid"

	"github.com/ProtPocket/models"
)

const maxJobs = 100

// JobStore tracks asynchronous docking jobs in memory with bounded capacity.
type JobStore struct {
	mu      sync.RWMutex
	order   []string
	results map[string]DockingResult
}

// NewJobStore creates an empty JobStore.
func NewJobStore() *JobStore {
	return &JobStore{
		results: make(map[string]DockingResult),
		order:   make([]string, 0, 16),
	}
}

// Submit queues a docking run and returns immediately with a new job ID.
func (s *JobStore) Submit(pocket models.Pocket, ligand models.Fragment, proteinPDBPath string) string {
	jobID := uuid.NewString()

	s.mu.Lock()
	s.evictIfNeededLocked(maxJobs - 1)
	s.order = append(s.order, jobID)
	s.results[jobID] = DockingResult{
		JobID:    jobID,
		PocketID: pocket.PocketID,
		Status:   "pending",
	}
	s.mu.Unlock()

	go s.runJob(context.Background(), jobID, pocket, ligand, proteinPDBPath)
	return jobID
}

// runJob executes RunDocking in the background and writes the terminal JobStore entry.
func (s *JobStore) runJob(ctx context.Context, jobID string, pocket models.Pocket, ligand models.Fragment, proteinPDBPath string) {
	res, err := RunDocking(ctx, jobID, pocket, ligand, proteinPDBPath)
	if err != nil {
		res = DockingResult{
			JobID:    jobID,
			PocketID: pocket.PocketID,
			Status:   "error",
			Error:    err.Error(),
		}
	}
	s.mu.Lock()
	s.results[jobID] = res
	s.mu.Unlock()
}

// evictIfNeededLocked drops the oldest jobs until len(order) <= maxLen.
func (s *JobStore) evictIfNeededLocked(maxLen int) {
	for len(s.order) > maxLen {
		old := s.order[0]
		s.order = s.order[1:]
		delete(s.results, old)
	}
}

// Get returns the latest DockingResult for a job ID.
func (s *JobStore) Get(jobID string) (DockingResult, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	r, ok := s.results[jobID]
	return r, ok
}
