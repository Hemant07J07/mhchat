#!/usr/bin/env python
"""
Integration Test Script: Verify Frontend-Backend API Compatibility

This test validates all endpoints that the frontend expects to call.
Run after fixing the endpoint path mismatches.
"""

import os
import sys
import json
import requests
from urllib.parse import urljoin

# Configuration
API_BASE = os.environ.get("API_BASE", "http://localhost:8000")
TEST_USER_EMAIL = "integration-test-user@example.com"
TEST_USER_USERNAME = "integration_test_user"
TEST_USER_PASSWORD = "TestPassword123!"

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    RESET = '\033[0m'
    BOLD = '\033[1m'

def log_test(name, passed, details=""):
    status = f"{Colors.GREEN}✓ PASS{Colors.RESET}" if passed else f"{Colors.RED}✗ FAIL{Colors.RESET}"
    print(f"{status} | {name}")
    if details:
        print(f"     {Colors.YELLOW}→ {details}{Colors.RESET}")

def log_section(title):
    print(f"\n{Colors.BOLD}{Colors.BLUE}{'='*70}{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.BLUE}{title}{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.BLUE}{'='*70}{Colors.RESET}")

class IntegrationTester:
    def __init__(self, base_url):
        self.base_url = base_url.rstrip('/')
        self.session = requests.Session()
        self.access_token = None
        self.user_id = None
        self.conversation_id = None
        self.message_id = None

    def url(self, path):
        """Build full URL"""
        return f"{self.base_url}{path}"

    def test_register(self):
        """Test user registration"""
        log_section("1. AUTHENTICATION - REGISTER")
        
        endpoint = "/api/auth/register/"
        payload = {
            "email": TEST_USER_EMAIL,
            "username": TEST_USER_USERNAME,
            "password": TEST_USER_PASSWORD,
        }
        
        try:
            resp = requests.post(self.url(endpoint), json=payload)
            passed = resp.status_code == 201
            
            if passed:
                data = resp.json()
                self.access_token = data.get('access')
                self.user_id = data.get('user', {}).get('id')
                
                has_user = 'user' in data
                has_access = 'access' in data
                has_refresh = 'refresh' in data
                
                log_test(f"POST {endpoint}", passed, f"Status {resp.status_code}")
                log_test("  → Has user object", has_user)
                log_test("  → Has access token", has_access)
                log_test("  → Has refresh token", has_refresh)
            else:
                log_test(f"POST {endpoint}", False, f"Status {resp.status_code}: {resp.text[:100]}")
        except Exception as e:
            log_test(f"POST {endpoint}", False, str(e))

    def test_login(self):
        """Test user login"""
        log_section("2. AUTHENTICATION - LOGIN")
        
        endpoint = "/api/auth/login/"
        payload = {
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD,
        }
        
        try:
            resp = requests.post(self.url(endpoint), json=payload)
            passed = resp.status_code == 200
            
            if passed:
                data = resp.json()
                self.access_token = data.get('access')
                self.user_id = data.get('user', {}).get('id')
                
                has_user = 'user' in data
                has_access = 'access' in data
                
                log_test(f"POST {endpoint}", passed, f"Status {resp.status_code}")
                log_test("  → Has user object", has_user)
                log_test("  → Has access token", has_access)
            else:
                log_test(f"POST {endpoint}", False, f"Status {resp.status_code}: {resp.text[:100]}")
        except Exception as e:
            log_test(f"POST {endpoint}", False, str(e))

    def test_token_refresh(self):
        """Test token refresh at corrected endpoint"""
        log_section("3. AUTHENTICATION - TOKEN REFRESH")
        
        endpoint = "/api/auth/token/refresh/"
        payload = {}
        
        # This requires a refresh token - we'll test the endpoint exists
        headers = {"Authorization": f"Bearer {self.access_token}"}
        
        try:
            resp = requests.post(self.url(endpoint), json=payload, headers=headers)
            # 200 = refreshed, 401 = unauthorized is expected if endpoint works correctly
            endpoint_exists = resp.status_code in [200, 400, 401]
            
            log_test(f"POST {endpoint}", endpoint_exists, f"Status {resp.status_code} (endpoint found)")
            
            # Also verify the legacy endpoint exists
            legacy_endpoint = "/api/token/refresh/"
            resp2 = requests.post(self.url(legacy_endpoint), json=payload, headers=headers)
            legacy_exists = resp2.status_code in [200, 400, 401]
            log_test(f"POST {legacy_endpoint}", legacy_exists, f"Status {resp2.status_code} (backwards compat)")
        except Exception as e:
            log_test(f"POST {endpoint}", False, str(e))

    def test_profile_get(self):
        """Test getting user profile"""
        log_section("4. PROFILE - GET")
        
        endpoint = "/api/profile/"
        headers = {"Authorization": f"Bearer {self.access_token}"}
        
        try:
            resp = requests.get(self.url(endpoint), headers=headers)
            passed = resp.status_code == 200
            
            if passed:
                data = resp.json()
                has_user = 'user' in data
                has_profile = 'profile' in data
                
                log_test(f"GET {endpoint}", passed, f"Status {resp.status_code}")
                log_test("  → Has user object", has_user and isinstance(data['user'], dict))
                log_test("  → Has profile object", has_profile and isinstance(data['profile'], dict))
                
                if has_user:
                    user = data['user']
                    log_test("    → Has id", 'id' in user)
                    log_test("    → Has username", 'username' in user)
                    log_test("    → Has email", 'email' in user)
                    log_test("    → Has first_name", 'first_name' in user)
                    log_test("    → Has last_name", 'last_name' in user)
                
                if has_profile:
                    profile = data['profile']
                    log_test("    → Has consent_given", 'consent_given' in profile)
                    log_test("    → Has phone", 'phone' in profile)
                    log_test("    → Has timezone", 'timezone' in profile)
            else:
                log_test(f"GET {endpoint}", False, f"Status {resp.status_code}: {resp.text[:100]}")
        except Exception as e:
            log_test(f"GET {endpoint}", False, str(e))

    def test_profile_update(self):
        """Test updating user profile"""
        log_section("5. PROFILE - UPDATE")
        
        endpoint = "/api/profile/"
        headers = {"Authorization": f"Bearer {self.access_token}"}
        payload = {
            "first_name": "Integration",
            "last_name": "Tester",
        }
        
        try:
            resp = requests.patch(self.url(endpoint), json=payload, headers=headers)
            passed = resp.status_code == 200
            
            if passed:
                data = resp.json()
                has_user = 'user' in data
                
                log_test(f"PATCH {endpoint}", passed, f"Status {resp.status_code}")
                log_test("  → Response has user object", has_user)
                
                if has_user:
                    updated = (
                        data['user'].get('first_name') == 'Integration' and
                        data['user'].get('last_name') == 'Tester'
                    )
                    log_test("  → First/Last names updated", updated)
            else:
                log_test(f"PATCH {endpoint}", False, f"Status {resp.status_code}: {resp.text[:100]}")
        except Exception as e:
            log_test(f"PATCH {endpoint}", False, str(e))

    def test_conversation_create(self):
        """Test creating a conversation"""
        log_section("6. CONVERSATIONS - CREATE")
        
        endpoint = "/api/conversations/"
        headers = {"Authorization": f"Bearer {self.access_token}"}
        payload = {}
        
        try:
            resp = requests.post(self.url(endpoint), json=payload, headers=headers)
            passed = resp.status_code == 201
            
            if passed:
                data = resp.json()
                self.conversation_id = data.get('id')
                
                has_id = 'id' in data
                has_user = 'user' in data
                has_started = 'started_at' in data
                
                log_test(f"POST {endpoint}", passed, f"Status {resp.status_code}")
                log_test("  → Has id", has_id)
                log_test("  → Has user", has_user)
                log_test("  → Has started_at", has_started)
            else:
                log_test(f"POST {endpoint}", False, f"Status {resp.status_code}: {resp.text[:100]}")
        except Exception as e:
            log_test(f"POST {endpoint}", False, str(e))

    def test_conversation_list(self):
        """Test listing conversations"""
        log_section("7. CONVERSATIONS - LIST")
        
        endpoint = "/api/conversations/"
        headers = {"Authorization": f"Bearer {self.access_token}"}
        
        try:
            resp = requests.get(self.url(endpoint), headers=headers)
            passed = resp.status_code == 200
            
            if passed:
                data = resp.json()
                # Handle both array and paginated responses
                convs = data if isinstance(data, list) else data.get('results', [])
                
                log_test(f"GET {endpoint}", passed, f"Status {resp.status_code}")
                log_test(f"  → Found {len(convs)} conversation(s)", True)
                
                if convs and len(convs) > 0:
                    has_recent_messages = 'recent_messages' in convs[0]
                    log_test("  → Has recent_messages field", has_recent_messages)
            else:
                log_test(f"GET {endpoint}", False, f"Status {resp.status_code}: {resp.text[:100]}")
        except Exception as e:
            log_test(f"GET {endpoint}", False, str(e))

    def test_conversation_get(self):
        """Test getting a conversation"""
        if not self.conversation_id:
            print(f"{Colors.YELLOW}⊘ Skipping GET conversation - no conversation_id{Colors.RESET}")
            return
        
        log_section("8. CONVERSATIONS - GET")
        
        endpoint = f"/api/conversations/{self.conversation_id}/"
        headers = {"Authorization": f"Bearer {self.access_token}"}
        
        try:
            resp = requests.get(self.url(endpoint), headers=headers)
            passed = resp.status_code == 200
            
            if passed:
                data = resp.json()
                log_test(f"GET {endpoint}", passed, f"Status {resp.status_code}")
            else:
                log_test(f"GET {endpoint}", False, f"Status {resp.status_code}: {resp.text[:100]}")
        except Exception as e:
            log_test(f"GET {endpoint}", False, str(e))

    def test_message_create(self):
        """Test creating a message"""
        if not self.conversation_id:
            print(f"{Colors.YELLOW}⊘ Skipping message tests - no conversation_id{Colors.RESET}")
            return
        
        log_section("9. MESSAGES - CREATE")
        
        endpoint = f"/api/conversations/{self.conversation_id}/messages/"
        headers = {"Authorization": f"Bearer {self.access_token}"}
        payload = {
            "text": "Test message for integration",
            "sender": "user"
        }
        
        try:
            resp = requests.post(self.url(endpoint), json=payload, headers=headers)
            passed = resp.status_code == 201
            
            if passed:
                data = resp.json()
                self.message_id = data.get('user_message', {}).get('id')
                
                has_user_msg = 'user_message' in data
                has_all_msgs = 'all_messages' in data
                
                log_test(f"POST {endpoint}", passed, f"Status {resp.status_code}")
                log_test("  → Has user_message", has_user_msg)
                log_test("  → Has all_messages", has_all_msgs)
                
                if has_user_msg:
                    user_msg = data['user_message']
                    log_test("    → Message has id", 'id' in user_msg)
                    log_test("    → Message has text", 'text' in user_msg)
                    log_test("    → Message has created_at", 'created_at' in user_msg)
                    log_test("    → Message has sender", user_msg.get('sender') == 'user')
            else:
                log_test(f"POST {endpoint}", False, f"Status {resp.status_code}: {resp.text[:100]}")
        except Exception as e:
            log_test(f"POST {endpoint}", False, str(e))

    def test_message_list(self):
        """Test listing messages"""
        if not self.conversation_id:
            print(f"{Colors.YELLOW}⊘ Skipping message list - no conversation_id{Colors.RESET}")
            return
        
        log_section("10. MESSAGES - LIST")
        
        endpoint = f"/api/conversations/{self.conversation_id}/messages/"
        headers = {"Authorization": f"Bearer {self.access_token}"}
        
        try:
            resp = requests.get(self.url(endpoint), headers=headers)
            passed = resp.status_code == 200
            
            if passed:
                data = resp.json()
                msgs = data if isinstance(data, list) else data.get('results', [])
                
                log_test(f"GET {endpoint}", passed, f"Status {resp.status_code}")
                log_test(f"  → Found {len(msgs)} message(s)", True)
                
                if msgs and len(msgs) > 0:
                    msg = msgs[0]
                    log_test("    → Has id", 'id' in msg)
                    log_test("    → Has sender", 'sender' in msg)
                    log_test("    → Has text", 'text' in msg)
                    log_test("    → Has created_at", 'created_at' in msg)
                    log_test("    → Has ml_results", 'ml_results' in msg)
            else:
                log_test(f"GET {endpoint}", False, f"Status {resp.status_code}: {resp.text[:100]}")
        except Exception as e:
            log_test(f"GET {endpoint}", False, str(e))

    def test_consent(self):
        """Test accepting consent"""
        log_section("11. PROFILE - ACCEPT CONSENT")
        
        endpoint = "/api/profile/accept-consent/"
        headers = {"Authorization": f"Bearer {self.access_token}"}
        payload = {}
        
        try:
            resp = requests.post(self.url(endpoint), json=payload, headers=headers)
            passed = resp.status_code == 200
            
            if passed:
                data = resp.json()
                has_consent = data.get('consent_given') == True
                
                log_test(f"POST {endpoint}", passed, f"Status {resp.status_code}")
                log_test("  → Consent set to True", has_consent)
            else:
                log_test(f"POST {endpoint}", False, f"Status {resp.status_code}: {resp.text[:100]}")
        except Exception as e:
            log_test(f"POST {endpoint}", False, str(e))

    def run_all_tests(self):
        """Run all integration tests"""
        print(f"\n{Colors.BOLD}{Colors.BLUE}FRONTEND-BACKEND INTEGRATION TEST SUITE{Colors.RESET}")
        print(f"API Base URL: {Colors.YELLOW}{self.base_url}{Colors.RESET}\n")
        
        self.test_register()
        self.test_login()
        self.test_token_refresh()
        self.test_profile_get()
        self.test_profile_update()
        self.test_conversation_create()
        self.test_conversation_list()
        self.test_conversation_get()
        self.test_message_create()
        self.test_message_list()
        self.test_consent()
        
        print(f"\n{Colors.BOLD}{Colors.BLUE}{'='*70}{Colors.RESET}")
        print(f"{Colors.BOLD}Integration tests complete{Colors.RESET}\n")

if __name__ == "__main__":
    tester = IntegrationTester(API_BASE)
    tester.run_all_tests()
