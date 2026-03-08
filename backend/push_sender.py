#!/usr/bin/env python3
import os, json, boto3
import firebase_admin
from firebase_admin import credentials, messaging, firestore

# Firebase Admin SDK init
sa_json = os.environ.get('FIREBASE_SERVICE_ACCOUNT_JSON', '{}')
sa_info = json.loads(sa_json)
if not firebase_admin._apps:
    cred = credentials.Certificate(sa_info)
    firebase_admin.initialize_app(cred)

db = firestore.client()

def get_latest_news():
    docs = db.collection('news').order_by('createdAt', direction=firestore.Query.DESCENDING).limit(1).get()
    if docs:
        return docs[0].to_dict()
    return None

def get_fcm_tokens():
    docs = db.collection('fcm_tokens').get()
    return [d.to_dict().get('token') for d in docs if d.to_dict().get('token')]

def send_push(title, body, tokens):
    if not tokens:
        print("No FCM tokens found.")
        return
    message = messaging.MulticastMessage(
        notification=messaging.Notification(title=title, body=body),
        tokens=tokens[:500],
    )
    response = messaging.send_each_for_multicast(message)
    print(f"FCM: {response.success_count} success, {response.failure_count} failure")

def send_email_ses(subject, body_text, recipient_emails):
    ses = boto3.client(
        'ses',
        region_name=os.environ.get('AWS_REGION', 'ap-northeast-1'),
        aws_access_key_id=os.environ.get('AWS_ACCESS_KEY_ID'),
        aws_secret_access_key=os.environ.get('AWS_SECRET_ACCESS_KEY'),
    )
    from_email = os.environ.get('SES_FROM_EMAIL', 'noreply@example.com')
    for email in recipient_emails:
        try:
            ses.send_email(
                Source=from_email,
                Destination={'ToAddresses': [email]},
                Message={
                    'Subject': {'Data': subject, 'Charset': 'UTF-8'},
                    'Body': {'Text': {'Data': body_text, 'Charset': 'UTF-8'}},
                },
            )
        except Exception as e:
            print(f"SES error for {email}: {e}")

def get_user_emails():
    docs = db.collection('users').get()
    return [d.to_dict().get('email') for d in docs if d.to_dict().get('email')]

if __name__ == '__main__':
    news = get_latest_news()
    if not news:
        print("No news to send.")
        exit(0)

    title = news.get('title', 'dripro news')
    body = news.get('summary') or news.get('content', '')[:100]

    tokens = get_fcm_tokens()
    send_push(title, body, tokens)

    emails = get_user_emails()
    subject = f"[dripro] {title}"
    body_text = f"{title}

{news.get('content', '')}

https://dripro.vercel.app"
    send_email_ses(subject, body_text, emails)

    print("Done.")
