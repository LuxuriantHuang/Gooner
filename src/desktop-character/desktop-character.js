const root = document.documentElement;
const character = document.getElementById('character');
const blurSource = document.getElementById('blur-source');

async function applyDesktopCharacter({ imageUrl, analysis, mode }) {
  const { colors, alignment } = analysis;
  root.style.setProperty('--global-color', colors.global);
  root.style.setProperty('--top-color', colors.top);
  root.style.setProperty('--bottom-color', colors.bottom);
  root.style.setProperty('--left-color', colors.left);
  root.style.setProperty('--right-color', colors.right);
  document.body.className = `mode-${mode}`;
  document.body.style.backgroundColor = colors.global;
  character.src = imageUrl;
  blurSource.src = imageUrl;
  character.style.objectPosition = `${alignment.x} ${alignment.y}`;
  await character.decode();
  return {
    currentSrc: character.currentSrc,
    width: character.naturalWidth,
    height: character.naturalHeight
  };
}

window.applyDesktopCharacter = applyDesktopCharacter;
window.desktopCharacter.onUpdate(data => {
  applyDesktopCharacter(data).catch(error => console.error('Failed to apply desktop character:', error));
});