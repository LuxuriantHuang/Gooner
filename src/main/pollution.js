const { clipboard } = require('electron');
const { exec, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { requestDeepSeekPopupText } = require('./ai-service');
const { getResolvedAiCard } = require('./config-store');

let config = null;
let clipboardTimer = null;
let inputTimer = null;
let lastClipboardText = '';
let lastPollutedText = '';
let schedulerActive = false;

function readTextFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  if (content.includes('\uFFFD')) {
    try {
      const script = `[Console]::OutputEncoding = [System.Text.Encoding]::UTF8; Get-Content -Path '${filePath.replace(/'/g, "''")}' -Encoding Default -Raw`;
      const output = execSync(`powershell -NoProfile -Command "${script}"`, { encoding: 'utf8' });
      return output;
    } catch (e) {
      return content;
    }
  }
  return content;
}

function getRandomCorpusText(corpusPath, minLength) {
  if (!corpusPath || !fs.existsSync(corpusPath)) return '';
  try {
    const files = fs.readdirSync(corpusPath).filter(f => f.endsWith('.txt'));
    if (files.length === 0) return '';
    const file = files[Math.floor(Math.random() * files.length)];
    const content = readTextFile(path.join(corpusPath, file));
    const chunks = content.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    if (chunks.length === 0) return '';
    
    let result = '';
    let attempts = 0;
    while (result.length < minLength && attempts < 10) {
      result += (result.length > 0 ? ' ' : '') + chunks[Math.floor(Math.random() * chunks.length)];
      attempts++;
    }
    return result;
  } catch (e) {
    console.error('Error reading corpus:', e);
    return '';
  }
}

async function generatePollutionText() {
  const p = config.pollution;
  const activeModes = [];
  if (p.modePhrase || config.hardcoreMode) activeModes.push('phrase');
  if (p.modeCorpus || config.hardcoreMode) activeModes.push('corpus');
  if (p.modeAi || config.hardcoreMode) activeModes.push('ai');

  if (activeModes.length === 0) return '';

  const mode = activeModes[Math.floor(Math.random() * activeModes.length)];

  if (mode === 'phrase') {
    const phrases = (p.phrases || '').split(',').map(s => s.trim()).filter(s => s);
    if (phrases.length === 0) return '';
    return phrases[Math.floor(Math.random() * phrases.length)];
  } else if (mode === 'corpus') {
    return getRandomCorpusText(p.corpusPath, p.corpusMinLength || 10);
  } else if (mode === 'ai') {
    try {
      const locale = config.language || 'zh-CN';
      const aiConfig = config.ai;
      const cardConfig = getResolvedAiCard(aiConfig, aiConfig.pollutionCardId);
      const result = await requestDeepSeekPopupText({ aiConfig, cardConfig, locale });
      if (result && result.text) return result.text;
    } catch (e) {
      console.error('Pollution AI Error:', e);
    }
  }
  return '';
}

async function checkClipboard() {
  if (!config?.pollution?.enabled || !config?.pollution?.clipboardEnabled) return;
  
  const text = clipboard.readText();
  if (text && text !== lastClipboardText && text !== lastPollutedText) {
    lastClipboardText = text;
    const chance = config.hardcoreMode ? 100 : (config.pollution.clipboardChance || 20);
    if (Math.random() * 100 < chance) {
      const pollution = await generatePollutionText();
      if (pollution) {
        let newText;
        if (text.length === 0) {
          newText = pollution;
        } else {
          const insertPos = Math.floor(Math.random() * (text.length + 1));
          newText = text.slice(0, insertPos) + pollution + text.slice(insertPos);
        }
        lastPollutedText = newText;
        clipboard.writeText(newText);
      }
    }
  } else {
    lastClipboardText = text;
  }
}

async function triggerInputPollution() {
  if (!config?.pollution?.enabled || !config?.pollution?.inputEnabled) return;

  const text = await generatePollutionText();
  if (text) {
    const backup = clipboard.readText();
    lastPollutedText = text;
    clipboard.writeText(text);
    
    const script = `
      $wshell = New-Object -ComObject wscript.shell;
      $wshell.SendKeys('^v');
    `;
    
    exec(`powershell -NoProfile -Command "${script}"`, (err) => {
      if (err) console.error('Input injection failed:', err);
      setTimeout(() => {
        if (backup) {
           clipboard.writeText(backup);
           lastClipboardText = backup;
        } else {
           clipboard.clear();
        }
      }, 500);
    });
  }

  scheduleNextInput();
}

function scheduleNextInput() {
  if (inputTimer) clearTimeout(inputTimer);
  if (!config?.pollution?.enabled || !config?.pollution?.inputEnabled) return;
  
  const min = config.hardcoreMode ? 1 : (config.pollution.inputIntervalMin || 10);
  const max = config.hardcoreMode ? 3 : Math.max(min, config.pollution.inputIntervalMax || 30);
  const delayMinutes = min + Math.random() * (max - min);
  
  inputTimer = setTimeout(triggerInputPollution, delayMinutes * 60 * 1000);
}

function onConfigChange(newConfig) {
  config = newConfig;
  stopTimers();
  if (!schedulerActive) return;
  startTimers();
}

function stopTimers() {
  if (clipboardTimer) {
    clearInterval(clipboardTimer);
    clipboardTimer = null;
  }
  
  if (inputTimer) {
    clearTimeout(inputTimer);
    inputTimer = null;
  }
}

function startTimers() {
  if (config?.pollution?.enabled || config?.hardcoreMode) {
    if (config?.pollution?.clipboardEnabled || config?.hardcoreMode) {
      lastClipboardText = clipboard.readText();
      clipboardTimer = setInterval(checkClipboard, 500);
    }
    if (config?.pollution?.inputEnabled || config?.hardcoreMode) {
      scheduleNextInput();
    }
  }
}

function setSchedulerActive(active) {
  schedulerActive = Boolean(active);
  if (schedulerActive) startTimers();
  else stopTimers();
}

module.exports = {
  onConfigChange,
  setSchedulerActive
};
