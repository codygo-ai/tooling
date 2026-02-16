import { RuleTester } from 'eslint';

import rule from '../../src/rules/enforce-tilde-imports.mjs';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
});

ruleTester.run('enforce-tilde-imports', rule, {
  valid: [
    // Libraries: relative imports
    {
      filename: 'server/libs/models/src/user.ts',
      code: "import { helper } from './helper';",
    },
    {
      filename: 'server/libs/models/src/auth/login.ts',
      code: "import { user } from '../user';",
    },
    {
      filename: 'client/libs/ui/src/Button/index.ts',
      code: "import { styles } from './styles';",
    },

    // Apps: relative within same directory tree
    {
      filename: 'server/apps/api/src/auth/login.ts',
      code: "import { validate } from './utils/validate';",
    },
    {
      filename: 'server/apps/api/src/auth/utils/helper.ts',
      code: "import { login } from '../login';",
    },

    // Apps: tilde for cross-directory
    {
      filename: 'server/apps/api/src/auth/login.ts',
      code: "import { profile } from '~/users/profile';",
    },
    {
      filename: 'server/apps/api/src/auth/login.ts',
      code: "import { helper } from '~/shared/helpers';",
    },

    // External packages (skip)
    {
      filename: 'server/apps/api/src/main.ts',
      code: "import { User } from '@codygo-ai/models';",
    },
  ],

  invalid: [
    // Libraries: cannot use ~/
    {
      filename: 'server/libs/models/src/user.ts',
      code: "import { helper } from '~/shared/helper';",
      errors: [{ messageId: 'noTildeInLibs' }],
      output: "import { helper } from './shared/helper';",
    },
    {
      filename: 'client/libs/ui/src/Button/index.ts',
      code: "import { theme } from '~/theme';",
      errors: [{ messageId: 'noTildeInLibs' }],
      output: "import { theme } from '../theme';",
    },

    // Apps: use tilde for cross-directory
    {
      filename: 'server/apps/api/src/auth/login.ts',
      code: "import { profile } from '../../users/profile';",
      errors: [{ messageId: 'useTildeForCrossDir' }],
      output: "import { profile } from '~/users/profile';",
    },
    {
      filename: 'server/apps/api/src/auth/utils/validate.ts',
      code: "import { helper } from '../../../shared/helpers';",
      errors: [{ messageId: 'useTildeForCrossDir' }],
      output: "import { helper } from '~/shared/helpers';",
    },

    // Apps: use relative for same directory
    {
      filename: 'server/apps/api/src/auth/login.ts',
      code: "import { validate } from '~/auth/utils/validate';",
      errors: [{ messageId: 'useRelativeForSameDir' }],
      output: "import { validate } from './utils/validate';",
    },
    {
      filename: 'server/apps/api/src/auth/utils/helper.ts',
      code: "import { login } from '~/auth/login';",
      errors: [{ messageId: 'useRelativeForSameDir' }],
      output: "import { login } from '../login';",
    },
  ],
});
