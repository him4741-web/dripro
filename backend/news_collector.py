#!/usr/bin/env python3
import os
import json
import hashlib
import datetime
import time
import xml.etree.ElementTree as ET

import requests
import firebase_admin
from firebase_admin import credentials, firestore
import google.generativeai as genai

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
genai.configure(api_key=GEMINI_API_KEY)
gemini_model = genai.GenerativeModel("gemini-1.5-flash")

sa_json = os.environ.get("FIREBASE_SERVICE_ACCOUNT_JSON", "{}")
sa_info = json.loads(sa_json)
if not firebase_admin._apps:
    cred = credentials.Certificate(sa_info)
    firebase_admin.initialize_app(cred)
db = firestore.client()

RSS_SOURCES = [
    {"name": "厚生労働省 新着情報", "url": "https://www.mhlw.go.jp/rss/saisin.rdf", "category": "法改正"},
    {"name": "厚生労働省 報道発表", "url": "https://www.mhlw.go.jp/rss/houdou.rdf", "category": "法改正"},
    {"name": "こども家庭庁", "url": "https://www.cfa.go.jp/rss.xml", "category": "法改正"},
    {"name": "内閣府", "url": "https://www.cao.go.jp/rss/saisin.xml", "category": "補助金"},
    {"name": "e-Gov", "url": "https://www.e-gov.go.jp/rss/news.rdf", "category": "法改正"},
]

GH_KEYWORDS = [
    "グループホーム", "GH", "共同生活", "障害", "介護", "高齢", "福祉",
    "ヘルパー", "訪問介護", "居宅", "施設", "処遇改善", "加算", "報酬",
    "補助金", "助成金", "支援費", "障害者", "認知症", "在宅", "通所",
    "入所", "サービス", "事業者", "指定基準", "人員配置",
]


def fetch_rss(url, timeout=15):
    try:
        headers = {"User-Agent": "dripro-news-bot/1.0"}
        resp = requests.get(url, headers=headers, timeout=timeout)
        resp.raise_for_status()
        resp.encoding = resp.apparent_encoding or "utf-8"
        root = ET.fromstring(resp.text.encode("utf-8"))
    except Exception as e:
        print(f"[WARN] RSS fetch failed: {url} -> {e}")
        return []

    items = []
    for item in root.iter():
        if item.tag in ("item", "{http://purl.org/rss/1.0/}item"):
            title_el = item.find("title") or item.find("{http://purl.org/rss/1.0/}title")
            link_el = item.find("link") or item.find("{http://purl.org/rss/1.0/}link")
            desc_el = item.find("description") or item.find("{http://purl.org/rss/1.0/}description")
            title = title_el.text.strip() if title_el is not None and title_el.text else ""
            link = link_el.text.strip() if link_el is not None and link_el.text else ""
            if not link and link_el is not None:
                link = link_el.get("{http://www.w3.org/1999/02/22-rdf-syntax-ns#}resource", "")
            desc = desc_el.text.strip() if desc_el is not None and desc_el.text else ""
            if title:
                items.append({"title": title, "link": link, "description": desc})
    return items


def is_gh_related(title, desc):
    text = title + " " + desc
    return any(kw in text for kw in GH_KEYWORDS)


def make_doc_id(url):
    return hashlib.md5(url.encode()).hexdigest()


def already_exists(doc_id):
    doc = db.collection("news").document(doc_id).get()
    return doc.exists


def summarize_with_gemini(title, desc, source_url, category):
    prompt = f"""あなたはGH事業者向けのニュース編集者です。
以下の行政ニュースを要約・整形してください。

【タイトル】{title}
【概要】{desc}
【URL】{source_url}
【カテゴリ候補】{category}

以下のJSON形式のみで返してください:
{{"title": "整形されたタイトル(30文字以内)", "summary": "要点まとめ(100文字以内)", "content": "詳細解説(300文字以内)", "category": "法改正 または 補助金 または 特報"}}"""

    try:
        response = gemini_model.generate_content(prompt)
        text = response.text.strip()
        if text.startswith("```"):
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]
        return json.loads(text.strip())
    except Exception as e:
        print(f"[WARN] Gemini error: {e}")
        return {
            "title": title[:30],
            "summary": desc[:100] if desc else title,
            "content": f"{desc}\n\n{source_url}",
            "category": category,
        }


def save_to_firestore(doc_id, data, source, original_url):
    now = datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=9)))
    doc_data = {
        "title": data.get("title", ""),
        "summary": data.get("summary", ""),
        "content": data.get("content", ""),
        "category": data.get("category", source["category"]),
        "isNew": True,
        "published": False,
        "sourceUrl": original_url,
        "sourceName": source["name"],
        "autoCollected": True,
        "createdAt": now.isoformat(),
        "updatedAt": now.isoformat(),
    }
    db.collection("news").document(doc_id).set(doc_data)
    print(f"[SAVE] {data.get('title', '')}")


def main():
    print("=== dripro News Collector 開始 ===")
    total_saved = 0

    for source in RSS_SOURCES:
        print(f"\n[FETCH] {source['name']}")
        items = fetch_rss(source["url"])
        print(f"  取得: {len(items)}件")

        for item in items:
            title = item["title"]
            desc = item["description"]
            url = item["link"]

            if not url:
                continue
            if not is_gh_related(title, desc):
                continue

            doc_id = make_doc_id(url)
            if already_exists(doc_id):
                print(f"  [SKIP] {title[:40]}")
                continue

            print(f"  [NEW] {title[:50]}")
            data = summarize_with_gemini(title, desc, url, source["category"])
            save_to_firestore(doc_id, data, source, url)
            total_saved += 1
            time.sleep(2)

    print(f"\n=== 完了: {total_saved}件保存 ===")


if __name__ == "__main__":
    main()
