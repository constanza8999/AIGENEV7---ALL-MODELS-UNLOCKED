import { FREEBUFF_FABLE5_MODEL_ID } from '@codebuff/common/constants/freebuff-models'

import { createBase2 } from './base2'

const definition = {
  ...createBase2('free', {
    model: FREEBUFF_FABLE5_MODEL_ID,
  }),
  id: 'base2-free-fable5',
  displayName: 'Buffy the Fable 5 Free Orchestrator',
}

export default definition
