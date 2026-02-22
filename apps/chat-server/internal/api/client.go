package api

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"time"
)

type User struct {
	ID    string `json:"id"`
	Email string `json:"email"`
	Name  string `json:"name"`
	Image string `json:"image"`
}

type Session struct {
	ID        string    `json:"id"`
	UserId    string    `json:"userId"`
	ExpiresAt time.Time `json:"expiresAt"`
}

type BetterAuthResponse struct {
	User    User    `json:"user"`
	Session Session `json:"session"`
}

var httpClient = &http.Client{Timeout: 10 * time.Second}

func baseURL() string {
	apiURL := strings.TrimRight(os.Getenv("API_URL"), "/")
	if apiURL == "" {
		apiURL = "http://localhost:8000"
	}
	return apiURL
}

func chatServerToken() string {
	return os.Getenv("CHAT_SERVER_TOKEN")
}

func doRequest(method, path string, body []byte) (*http.Response, error) {
	url := baseURL() + path
	req, err := http.NewRequest(method, url, bytes.NewReader(body))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	if token := chatServerToken(); token != "" {
		req.Header.Set("x-chat-server-token", token)
	}
	return httpClient.Do(req)
}

func ValidateSession(r *http.Request) (*User, error) {
	url := baseURL() + "/v1/auth/get-session"
	req, err := http.NewRequest(http.MethodGet, url, nil)
	if err != nil {
		return nil, err
	}

	if cookie := r.Header.Get("Cookie"); cookie != "" {
		req.Header.Set("Cookie", cookie)
	}
	if auth := r.Header.Get("Authorization"); auth != "" {
		req.Header.Set("Authorization", auth)
	}

	res, err := httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer res.Body.Close()

	if res.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("session validation failed: %d", res.StatusCode)
	}

	var authRes BetterAuthResponse
	if err := json.NewDecoder(res.Body).Decode(&authRes); err != nil {
		return nil, err
	}

	if authRes.User.ID == "" {
		return nil, fmt.Errorf("invalid session response")
	}

	return &authRes.User, nil
}

func PersistEvent(payload []byte) error {
	res, err := doRequest(http.MethodPost, "/v1/chats/events", payload)
	if err != nil {
		return err
	}
	defer res.Body.Close()
	if res.StatusCode >= 200 && res.StatusCode < 300 {
		return nil
	}
	b, _ := io.ReadAll(res.Body)
	return fmt.Errorf("api persist event failed: status=%d body=%s", res.StatusCode, strings.TrimSpace(string(b)))
}

func GetUserThreads(userID string) ([]string, error) {
	res, err := doRequest(http.MethodGet, "/v1/chats/internal/users/"+userID+"/threads", nil)
	if err != nil {
		return nil, err
	}
	defer res.Body.Close()

	if res.StatusCode < 200 || res.StatusCode >= 300 {
		b, _ := io.ReadAll(res.Body)
		return nil, fmt.Errorf("api get threads failed: status=%d body=%s", res.StatusCode, strings.TrimSpace(string(b)))
	}

	var threads []string
	if err := json.NewDecoder(res.Body).Decode(&threads); err != nil {
		return nil, err
	}
	return threads, nil
}
