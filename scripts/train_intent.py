# scripts/train_intent.py
import pandas as pd
from sklearn.pipeline import make_pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
import joblib
df = pd.read_csv('data/intent_samples.csv')
pipe = make_pipeline(TfidfVectorizer(ngram_range=(1,2), max_features=10000), LogisticRegression(max_iter=500))
pipe.fit(df['text'].astype(str).values, df['intent'].values)
joblib.dump(pipe, 'chat/nlp.py')
print('Saved chat/nlp.py')
