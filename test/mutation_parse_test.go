package test

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"

	"github.com/ProtPocket/routes"
	"github.com/ProtPocket/services"
)

// --- Unit tests: ParseMutation -------------------------------------------

func TestParseMutationValid(t *testing.T) {
	cases := []struct {
		input   string
		gene    string
		pos     int
		wt, mut string
	}{
		{"EGFR T790M", "EGFR", 790, "T", "M"},
		{"T790M", "", 790, "T", "M"},
		{"p.T790M", "", 790, "T", "M"},
		{"EGFR p.T790M", "EGFR", 790, "T", "M"},
		{"BCR-ABL T315I", "BCR-ABL", 315, "T", "I"},
		{"KRAS G12C", "KRAS", 12, "G", "C"},
		{"egfr t790m", "EGFR", 790, "T", "M"}, // case-insensitive
	}

	for _, tc := range cases {
		t.Run(tc.input, func(t *testing.T) {
			got, err := services.ParseMutation(tc.input)
			if err != nil {
				t.Fatalf("ParseMutation(%q) unexpected error: %v", tc.input, err)
			}
			if got.Gene != tc.gene {
				t.Errorf("Gene = %q, want %q", got.Gene, tc.gene)
			}
			if got.Position != tc.pos {
				t.Errorf("Position = %d, want %d", got.Position, tc.pos)
			}
			if got.WildtypeAA != tc.wt {
				t.Errorf("WildtypeAA = %q, want %q", got.WildtypeAA, tc.wt)
			}
			if got.MutantAA != tc.mut {
				t.Errorf("MutantAA = %q, want %q", got.MutantAA, tc.mut)
			}
			if got.Raw == "" {
				t.Error("Raw should not be empty")
			}
		})
	}
}

func TestParseMutationInvalid(t *testing.T) {
	cases := []struct {
		input  string
		reason string
	}{
		{"", "empty string"},
		{"T790T", "wildtype == mutant"},
		{"790M", "missing wildtype AA"},
		{"TM", "missing position"},
		{"T0M", "position zero"},
		{"EGFR T790M extra token", "too many tokens"},
		{"B790M", "invalid wildtype AA (B)"},
		{"T790B", "invalid mutant AA (B)"},
	}

	for _, tc := range cases {
		t.Run(tc.reason, func(t *testing.T) {
			_, err := services.ParseMutation(tc.input)
			if err == nil {
				t.Errorf("ParseMutation(%q) expected error (%s), got nil", tc.input, tc.reason)
			}
		})
	}
}

// --- HTTP handler test ---------------------------------------------------

func newMutationTestServer(t *testing.T) *httptest.Server {
	t.Helper()
	gin.SetMode(gin.TestMode)
	r := gin.New()
	routes.Register(r)
	return httptest.NewServer(r)
}

func TestMutationParseEndpoint(t *testing.T) {
	srv := newMutationTestServer(t)
	defer srv.Close()

	t.Run("valid EGFR T790M", func(t *testing.T) {
		body, _ := json.Marshal(map[string]string{"mutation": "EGFR T790M"})
		resp, err := http.Post(srv.URL+"/mutation/parse", "application/json", bytes.NewReader(body))
		if err != nil {
			t.Fatalf("POST /mutation/parse: %v", err)
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusOK {
			t.Fatalf("status = %d, want 200", resp.StatusCode)
		}

		var got services.ParsedMutation
		if err := json.NewDecoder(resp.Body).Decode(&got); err != nil {
			t.Fatalf("decode response: %v", err)
		}
		if got.Gene != "EGFR" || got.Position != 790 || got.WildtypeAA != "T" || got.MutantAA != "M" {
			t.Errorf("unexpected result: %+v", got)
		}
	})

	t.Run("missing mutation field", func(t *testing.T) {
		body := []byte(`{}`)
		resp, err := http.Post(srv.URL+"/mutation/parse", "application/json", bytes.NewReader(body))
		if err != nil {
			t.Fatalf("POST /mutation/parse: %v", err)
		}
		defer resp.Body.Close()
		if resp.StatusCode != http.StatusBadRequest {
			t.Errorf("status = %d, want 400", resp.StatusCode)
		}
	})

	t.Run("invalid variant T790T", func(t *testing.T) {
		body, _ := json.Marshal(map[string]string{"mutation": "T790T"})
		resp, err := http.Post(srv.URL+"/mutation/parse", "application/json", bytes.NewReader(body))
		if err != nil {
			t.Fatalf("POST /mutation/parse: %v", err)
		}
		defer resp.Body.Close()
		if resp.StatusCode != http.StatusBadRequest {
			t.Errorf("status = %d, want 400", resp.StatusCode)
		}
	})
}
