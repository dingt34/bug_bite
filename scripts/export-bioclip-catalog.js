const fs = require('fs');
const path = require('path');
const knowledge = require('../cloudfunctions/identifyInsect/knowledge-base');
const guide = require('../miniprogram/utils/insect-guide');

const outputPath = path.join(__dirname, '..', 'bioclip-service', 'species.json');
const records = knowledge.listKnowledgePacks().map(item => {
  const detail = guide.getById(item.objectId);
  return {
    objectId: item.objectId,
    name: item.name,
    scientificName: item.scientificName,
    modelLabel: item.scientificName
      .replace(/;/g, ' or ')
      .replace(/\//g, ' or ')
      .replace(/\s+/g, ' ')
      .trim(),
    referenceImages: (detail.images || []).map(image => image.src.replace(/^\/images\/insect-guide\//, ''))
  };
});

if (records.length !== 45) throw new Error(`Expected 45 catalog records, received ${records.length}`);
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(records, null, 2) + '\n', 'utf8');
console.log(`Exported ${records.length} BioCLIP labels to ${outputPath}`);
