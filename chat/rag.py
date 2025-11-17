# chat/rag.py (new)
from django.db import connection
from chat.models import MessageEmbedding
import numpy as np

def top_k_similar_embeddings(query_vec, k=5):
    # using pgvector operator <-> for distance (Postgres)
    sql = """
    SELECT m.message_id, me.vector
    FROM chat_messageembedding me
    JOIN chat_message m ON m.id = me.message_id
    ORDER BY me.vector <-> %s
    LIMIT %s;
    """
    with connection.cursor() as cur:
        cur.execute(sql, (query_vec, k))
        rows = cur.fetchall()
    return [r[0] for r in rows]  # returns message ids (you can fetch text)
