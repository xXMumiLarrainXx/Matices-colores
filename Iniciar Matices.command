#!/bin/bash

cd "$(dirname "$0")" || exit 1

if [ -z "$GEMINI_API_KEY" ] && [ -n "$GOOGLE_API_KEY" ]; then
  GEMINI_API_KEY="$GOOGLE_API_KEY"
fi

if [ -z "$GEMINI_API_KEY" ] && ! grep -Eq '^[[:space:]]*(GEMINI_API_KEY|GOOGLE_API_KEY)=' .env 2>/dev/null; then
  GEMINI_API_KEY="$(osascript <<'APPLESCRIPT'
try
  set keyPrompt to display dialog "Pega tu clave de Google AI Studio. El texto se ocultará mientras escribes. Puedes cancelar para iniciar sin prueba virtual con IA." default answer "" with hidden answer buttons {"Iniciar sin IA", "Iniciar"} default button "Iniciar" cancel button "Iniciar sin IA"
  return text returned of keyPrompt
on error number -128
  return ""
end try
APPLESCRIPT
)"
fi

GEMINI_API_KEY="$(printf '%s' "$GEMINI_API_KEY" | sed 's/^[[:space:]]*//; s/[[:space:]]*$//')"
if [ -n "$GEMINI_API_KEY" ]; then
  export GEMINI_API_KEY
  printf "Iniciando Matices con Google AI Studio habilitado. Deja esta ventana abierta.\n"
else
  printf "Iniciando Matices sin prueba virtual con IA.\n"
fi
exec .venv/bin/python app.py
