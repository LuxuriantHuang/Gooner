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

module.exports = { shouldRunVisualOverlay, shouldRunVisualFlash, getVisualMediaFiles };
