# 🔧 How to Enable AI-Generated Responses

**Current Status:** The chat is using a fallback response generator because the MedGemma AI server is not running.

---

## 🎯 The Problem

When you send a message:
1. ✓ The message is saved to the database
2. ✓ The backend processes it (NLU analysis, safety check)
3. ✓ A response IS generated, but it's using a **fallback generator** (rule-based, not AI)
4. ✗ MedGemma server is NOT running on port 8080

---

## ✅ Solution: Start MedGemma Server

You have two options:

### Option 1: Using Ollama (Recommended for Medical AI)

If you have Ollama installed with the `medgemma-4b` model:

```bash
# Open a new terminal and run:
ollama serve medgemma-4b
```

This will start the MedGemma server on `http://localhost:8080`

**Requirements:**
- [Ollama](https://ollama.ai) installed
- `medgemma-4b` model downloaded (runs locally, no internet needed)

### Option 2: Alternative AI Services

#### Using LM Studio (Local)
```bash
# Install LM Studio from https://lmstudio.ai
# Load medgemma-4b model
# Start server on port 8080
# Ensure API compatibility with OpenAI format
```

#### Using OpenAI API
Update `mhchat_proj/settings.py`:
```python
import os
os.environ['OPENAI_API_KEY'] = 'your-api-key-here'
```

---

## 🧪 Verify It's Working

After starting the server, run this test:

```bash
python test_medgemma.py
```

**Expected output:**
```
Available: True
✓ MedGemma server is RUNNING on port 8080
✓ Response generated using MedGemma
```

---

## 🔄 How It Works

### Current Flow (Fallback):
```
User Message 
  ↓
Saved to Database
  ↓
NLU Analysis (intent, sentiment, entities)
  ↓
Safety Check (flag if high-risk)
  ↓
Fallback Generator (rule-based, limited responses)
  ↓
Bot Response Saved & Displayed
```

### With MedGemma AI:
```
User Message
  ↓
Saved to Database
  ↓
NLU Analysis (intent, sentiment, entities)
  ↓
Safety Check (flag if high-risk)
  ↓
Call MedGemma AI Server on port 8080
  ↓
MedGemma generates intelligent medical response
  ↓
Bot Response Saved & Displayed
```

### With OpenAI:
```
User Message
  ↓
Saved to Database
  ↓
NLU Analysis
  ↓
Safety Check
  ↓
Call OpenAI API
  ↓
OpenAI generates response
  ↓
Bot Response Saved & Displayed
```

---

## 📊 Fallback vs AI Responses

### Fallback Generator (Current)
- ✓ Always works, no external dependencies
- ✓ Fast (instant response)
- ✓ Good emotional support messages
- ✗ Limited to predefined patterns
- ✗ Not medically informed
- ✗ Generic responses

**Example:**
```
User: "I have been having headaches for 3 days"
Fallback: "Thank you for sharing that. Can you tell me more?"
```

### MedGemma AI (What you want)
- ✓ Intelligent, context-aware responses
- ✓ Medical knowledge
- ✓ Personalized replies
- ✓ Conversational (remembers context)
- ✗ Requires server running
- ✗ Slightly slower (LLM inference)

**Example:**
```
User: "I have been having headaches for 3 days"
MedGemma: "A 3-day headache could be due to stress, dehydration, or other causes. 
Have you had any other symptoms like fever or vision changes? Try staying hydrated 
and resting in a quiet space. If it persists, consult your doctor."
```

---

## 🚀 Quick Start Guide

### Step 1: Install Ollama
Download from [https://ollama.ai](https://ollama.ai)

### Step 2: Pull MedGemma Model
```bash
ollama pull medgemma-4b
```
(First time will download ~10GB, subsequent runs are instant)

### Step 3: Start the Server
```bash
ollama serve medgemma-4b
```
Keep this terminal window open

### Step 4: Test the Setup
In another terminal:
```bash
cd C:\Users\hdube\mhchat
python test_medgemma.py
```

### Step 5: Use the Chat
- Open http://localhost:3000
- Send a message
- You should now get AI-generated responses!

---

## 🔍 Configuration Files

### Backend Settings
**File:** `mhchat_proj/settings.py`

```python
# MedGemma Configuration
MEDGEMMA_BASE_URL = 'http://localhost:8080'
MEDGEMMA_MODEL = 'medgemma-4b'
MEDGEMMA_TIMEOUT = 60

# Enable AI (if you want to use fallback only, set to False)
# USE_LLM = True  # Default
```

### Response Priority Order
**File:** `chat/tasks.py` (function: `_call_llm_safe`)

1. **MedGemma** (medical AI - recommended)
2. **OpenAI** (if API key configured)
3. **Fallback Generator** (rule-based)

---

## 🐛 Troubleshooting

### Issue: "MedGemma server is NOT running"
**Cause:** Ollama server not started  
**Solution:** Run `ollama serve medgemma-4b` in a terminal

### Issue: "Connection refused (10061)"
**Cause:** Server not listening on port 8080  
**Solution:** 
- Check Ollama is running
- Verify port 8080 is not in use: `netstat -ano | findstr :8080`
- Try different port in settings

### Issue: "Model not found"
**Cause:** medgemma-4b not downloaded  
**Solution:** `ollama pull medgemma-4b`

### Issue: Slow responses
**Cause:** LLM inference takes time (depends on hardware)  
**Solution:** This is normal (3-30 seconds). Optimize GPU usage if available.

---

## 📈 Performance Tips

### For Faster Responses:
1. **Use GPU:** If you have NVIDIA GPU, Ollama will auto-detect and use it
2. **Optimize Settings:** Reduce `max_tokens` in API calls
3. **Monitor System:** Check CPU/RAM usage with Task Manager

### Typical Response Times:
- **CPU Only:** 10-30 seconds per response
- **With GPU:** 1-5 seconds per response

---

## 🔐 Privacy Note

When using Ollama:
- ✓ All data stays on your machine
- ✓ No requests sent to external services
- ✓ Completely private and secure

When using OpenAI:
- ⚠ Requests sent to OpenAI servers
- ⚠ Subject to their terms of service
- ⚠ Ensure patient privacy compliance

---

## 📞 Next Steps

1. **Install Ollama** from https://ollama.ai
2. **Pull the model:** `ollama pull medgemma-4b`
3. **Start the server:** `ollama serve medgemma-4b`
4. **Test the integration:** `python test_medgemma.py`
5. **Use the chat:** http://localhost:3000

After these steps, you'll get **intelligent AI-generated responses** instead of fallback messages!

---

## 📚 Additional Resources

- **Ollama GitHub:** https://github.com/jmorganca/ollama
- **MedGemma Model:** https://huggingface.co/google/medgemma-7b
- **OpenAI API:** https://platform.openai.com/api/
- **Project Documentation:** See `FRONTEND_BACKEND_INTEGRATION_STATUS.md`

