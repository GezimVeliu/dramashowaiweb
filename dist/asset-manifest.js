// Canonical production-art registry. Never add private download URLs here.
// Publish an asset only after its exact Drive file id and revision are known.
export const assetManifest = Object.freeze({
  seriesId: 'chance', episodeId: 'E01',
  sourceFolders: Object.freeze({
    michael2026Age64: '1ieVWyat016nyLTrX-v9Ru2adaOLQaULU',
    michael2014Age52: '1DdLmeLNckQP3TcSlKVvKxxY3KOQBR4v9',
    emmaNowAge34: '116fOQcNf9P2jtcSPHcL4wuQu2I_1jq_S',
    approvedE01Frames: '19PZ-20OEmr6jCSepPPPM0Vrl_czNKm62'
  }),
  // Legacy second-chance.png is deliberately excluded: it is not an approved
  // representation of Michael at age 64.
  assets: Object.freeze([])
});
