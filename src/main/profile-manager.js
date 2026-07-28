const fs = require('fs/promises');
const path = require('path');
const { getConfigPath, defaultConfig } = require('./config-store');

function getProfilesDirPath(app) {
  return path.join(app.getPath('userData'), 'profiles');
}

function getProfilesIndexPath(app) {
  return path.join(app.getPath('userData'), 'profiles.json');
}

const DEFAULT_PROFILES = require('../shared/default-profiles');

// Keep PRESET_TEMPLATES exported as it was, but construct it from DEFAULT_PROFILES excluding 'default'
const PRESET_TEMPLATES = {};
for (const [id, profile] of Object.entries(DEFAULT_PROFILES)) {
  if (id !== 'default') {
    PRESET_TEMPLATES[id] = profile;
  }
}

async function readProfilesIndex(app) {
  try {
    const data = await fs.readFile(getProfilesIndexPath(app), 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return {
      'default': { name: '默认模式 (Default)', path: getConfigPath(app) }
    };
  }
}

async function writeProfilesIndex(app, index) {
  await fs.writeFile(getProfilesIndexPath(app), JSON.stringify(index, null, 2), 'utf8');
}

async function listProfiles(app) {
  const index = await readProfilesIndex(app);
  return Object.entries(index).map(([id, meta]) => ({
    id,
    name: meta.name,
    path: meta.path
  }));
}

async function createProfile(app, profileId, name, templateId = null, currentConfig = null) {
  const index = await readProfilesIndex(app);
  if (index[profileId]) {
    throw new Error(`Profile ${profileId} already exists`);
  }

  const profilesDir = getProfilesDirPath(app);
  await fs.mkdir(profilesDir, { recursive: true });

  const profilePath = path.join(profilesDir, `${profileId}.json`);
  
  let newConfig = JSON.parse(JSON.stringify(currentConfig || defaultConfig));
  
  if (templateId && PRESET_TEMPLATES[templateId]) {
    const template = PRESET_TEMPLATES[templateId];
    newConfig = JSON.parse(JSON.stringify(template.config)); // Completely use the template's config
  }

  await fs.writeFile(profilePath, JSON.stringify(newConfig, null, 2), 'utf8');

  index[profileId] = { name, path: profilePath };
  await writeProfilesIndex(app, index);

  return profilePath;
}

async function deleteProfile(app, profileId) {
  if (profileId === 'default') {
    throw new Error('Cannot delete default profile');
  }
  
  const index = await readProfilesIndex(app);
  const profile = index[profileId];
  if (!profile) return;

  delete index[profileId];
  await writeProfilesIndex(app, index);

  try {
    await fs.unlink(profile.path);
  } catch (err) {
    console.error(`Failed to delete profile file ${profile.path}:`, err);
  }
}

async function renameProfile(app, profileId, newName) {
  const index = await readProfilesIndex(app);
  if (!index[profileId]) {
    throw new Error(`Profile ${profileId} not found`);
  }
  index[profileId].name = newName;
  await writeProfilesIndex(app, index);
}

async function initProfiles(app, currentConfig) {
  try {
    await fs.access(getProfilesIndexPath(app));
    return false; // Not a first-time init
  } catch {
    console.log('Initializing predefined profiles...');
    
    // Overwrite the main config.json with the 'default' bundled profile ONLY if no existing user data
    const { getConfigContentScore } = require('./config-store');
    const hasData = currentConfig && getConfigContentScore(currentConfig) > 0;
    
    if (!hasData) {
      const defaultProfileConfig = DEFAULT_PROFILES['default']?.config;
      if (defaultProfileConfig) {
        const configPath = getConfigPath(app);
        await fs.writeFile(configPath, JSON.stringify(defaultProfileConfig, null, 2), 'utf8');
        console.log('Default config overwritten with preset.');
      }
    } else {
      console.log('Preserved existing config.json data as default profile.');
    }

    await writeProfilesIndex(app, {
      'default': { name: DEFAULT_PROFILES['default']?.name || '默认模式 (Default)', path: getConfigPath(app) }
    });
    
    for (const [id, template] of Object.entries(PRESET_TEMPLATES)) {
      try {
        await createProfile(app, id, template.name, id, currentConfig);
      } catch (err) {
        console.error(`Failed to create preset profile ${id}:`, err);
      }
    }
    return true; // Indicates we initialized profiles
  }
}

module.exports = {
  listProfiles,
  createProfile,
  deleteProfile,
  renameProfile,
  initProfiles,
  PRESET_TEMPLATES
};
