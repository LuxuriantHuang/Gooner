function shouldRunVisualOverlay(config, schedulerRunning) {
  if (!config) return false;
  const visual = config.visualIntervention || {};
  const hasVisualFeature = visual.enabled || visual.ghostEnabled || visual.xrayEnabled
    || visual.waterfallEnabled || visual.flashEnabled;
  return !!config.hardcoreMode || (!!hasVisualFeature && (!!visual.independentOfScheduler || schedulerRunning));
}

function getVisualMediaFiles(mediaLibrary, useOnlineMedia) {
  return (Array.isArray(mediaLibrary) ? mediaLibrary : [])
    .filter(media => media && (useOnlineMedia || !media.url))
    .map(media => media.url || media.path)
    .filter(value => typeof value === 'string' && value.length > 0);
}

function shouldRunVisualFlash(config, schedulerRunning) {
  const visual = config?.visualIntervention || {};
  return shouldRunVisualOverlay(config, schedulerRunning) && !!(config.hardcoreMode || visual.flashEnabled);
}

function isDisplaySelected(displayId, selectedDisplayIds) {
  return !Array.isArray(selectedDisplayIds) || selectedDisplayIds.length === 0
    || selectedDisplayIds.map(String).includes(String(displayId));
}

function getVisualFeaturesForDisplay(visual = {}, displayId, hardcoreMode = false) {
  return {
    ghostEnabled: !!visual.ghostEnabled && isDisplaySelected(displayId, visual.ghostDisplayIds),
    xrayEnabled: !!visual.xrayEnabled && isDisplaySelected(displayId, visual.xrayDisplayIds),
    waterfallEnabled: !!(hardcoreMode || visual.waterfallEnabled) && isDisplaySelected(displayId, visual.waterfallDisplayIds),
    flashEnabled: !!(hardcoreMode || visual.flashEnabled) && isDisplaySelected(displayId, visual.flashDisplayIds)
  };
}

module.exports = { shouldRunVisualOverlay, shouldRunVisualFlash, getVisualMediaFiles, isDisplaySelected, getVisualFeaturesForDisplay };
