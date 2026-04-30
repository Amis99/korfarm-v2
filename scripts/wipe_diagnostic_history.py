#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
진단 응시 기록 wipe 스크립트.
- 옵션: --all (전체) | --user <userId>
- diag_responses → diag_sessions 순으로 DELETE (FK 안전)
- 실행 전 카운트 출력, 실행 후 카운트 재확인
"""
from __future__ import annotations
import argparse, os, sys
from sshtunnel import SSHTunnelForwarder
import mysql.connector

SSH_HOST = "43.200.104.102"
SSH_KEY = os.path.expanduser("~/.ssh/korfarm-ec2.pem")
DB_HOST = "korfarm-db.cbmec44k8411.ap-northeast-2.rds.amazonaws.com"
DB_USER = "admin"
DB_PASS = "xXoM4Ld7VAIYl9W874md5kic"
DB_NAME = "korfarm"


def main():
    parser = argparse.ArgumentParser(description="진단 응시 기록 삭제")
    g = parser.add_mutually_exclusive_group(required=True)
    g.add_argument("--all", action="store_true", help="모든 사용자 진단 기록 삭제")
    g.add_argument("--user", help="특정 user_id 의 기록만 삭제")
    args = parser.parse_args()

    print("SSH 터널 연결 중...")
    with SSHTunnelForwarder(
        SSH_HOST, ssh_username="ec2-user", ssh_pkey=SSH_KEY,
        remote_bind_address=(DB_HOST, 3306), local_bind_address=("127.0.0.1", 13310),
    ) as tunnel:
        conn = mysql.connector.connect(
            host="127.0.0.1", port=tunnel.local_bind_port,
            user=DB_USER, password=DB_PASS, database=DB_NAME, charset="utf8mb4",
        )
        cur = conn.cursor()

        # 사전 카운트
        cur.execute("SELECT COUNT(*) FROM diag_sessions" + (
            "" if args.all else " WHERE user_id = %s"
        ), () if args.all else (args.user,))
        sess_before = cur.fetchone()[0]

        cur.execute("SELECT COUNT(*) FROM diag_responses" + (
            "" if args.all else " WHERE session_id IN (SELECT id FROM diag_sessions WHERE user_id = %s)"
        ), () if args.all else (args.user,))
        resp_before = cur.fetchone()[0]

        print(f"삭제 대상: sessions={sess_before}, responses={resp_before}")

        # DELETE
        if args.all:
            cur.execute("DELETE FROM diag_responses")
            print(f"  diag_responses: {cur.rowcount} 삭제")
            cur.execute("DELETE FROM diag_sessions")
            print(f"  diag_sessions: {cur.rowcount} 삭제")
        else:
            cur.execute(
                "DELETE FROM diag_responses WHERE session_id IN (SELECT id FROM diag_sessions WHERE user_id = %s)",
                (args.user,),
            )
            print(f"  diag_responses: {cur.rowcount} 삭제")
            cur.execute("DELETE FROM diag_sessions WHERE user_id = %s", (args.user,))
            print(f"  diag_sessions: {cur.rowcount} 삭제")

        conn.commit()

        # 사후 카운트
        cur.execute("SELECT COUNT(*) FROM diag_sessions")
        cur.execute("SELECT COUNT(*) FROM diag_responses")
        print("DELETE 완료")
        conn.close()


if __name__ == "__main__":
    main()
