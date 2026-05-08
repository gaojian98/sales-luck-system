#!/usr/bin/env python3
"""
Backend API smoke test:
register -> login -> wallet -> spin -> records -> community -> packages -> recharge -> wallet
"""

import json
import os
import time
import urllib.error
import urllib.request

BASE_URL = os.getenv("BASE_URL", "http://127.0.0.1:3001")


def parse_payload(text):
    if not text:
        return {}
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        return {"_raw": text}


def request(method, path, data=None, token=None):
    url = f"{BASE_URL}{path}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"

    body = None if data is None else json.dumps(data).encode("utf-8")
    req = urllib.request.Request(url, data=body, headers=headers, method=method)

    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            text = resp.read().decode("utf-8")
            payload = parse_payload(text)
            return resp.status, payload
    except urllib.error.HTTPError as err:
        text = err.read().decode("utf-8")
        payload = parse_payload(text)
        return err.code, payload


def assert_success(step, status, payload):
    if status != 200 or payload.get("success") is False:
        raise RuntimeError(f"{step} failed: status={status}, payload={payload}")


def main():
    username = f"smoke_{int(time.time())}"
    password = "Pass123456"
    email = f"{username}@mail.com"

    status, payload = request("GET", "/health")
    if status != 200 or payload.get("status") != "ok":
        raise RuntimeError(f"health failed: status={status}, payload={payload}")

    status, payload = request(
        "POST",
        "/api/auth/register",
        {"username": username, "password": password, "email": email},
    )
    assert_success("register", status, payload)

    status, payload = request(
        "POST",
        "/api/auth/login",
        {"account": username, "password": password},
    )
    assert_success("login", status, payload)
    token = payload.get("data", {}).get("token")
    if not token:
        raise RuntimeError(f"login token missing: payload={payload}")

    status, payload = request("GET", "/api/wallet", token=token)
    assert_success("wallet", status, payload)

    status, payload = request("POST", "/api/lottery/spin", {}, token=token)
    assert_success("spin", status, payload)

    status, payload = request("GET", "/api/lottery/records", token=token)
    assert_success("records", status, payload)

    status, payload = request(
        "POST",
        "/api/community/posts",
        {"content": "smoke test post"},
        token=token,
    )
    assert_success("community_create_post", status, payload)

    status, payload = request("GET", "/api/community/posts?limit=10", token=token)
    assert_success("community_list_posts", status, payload)

    status, payload = request("GET", "/api/recharge/packages", token=token)
    assert_success("packages", status, payload)

    status, payload = request("POST", "/api/recharge/create", {"packageId": 1}, token=token)
    assert_success("recharge", status, payload)

    status, payload = request("GET", "/api/wallet", token=token)
    assert_success("wallet_after_recharge", status, payload)

    status, payload = request("GET", "/api/recharge/records", token=token)
    assert_success("recharge_records", status, payload)

    print("E2E smoke passed.")


if __name__ == "__main__":
    main()
