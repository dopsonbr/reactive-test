import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { Tree } from '@nx/devkit';

import { uiComponentGenerator } from './ui-component';
import { UiComponentGeneratorSchema } from './schema';

describe('ui-component generator', () => {
  let tree: Tree;
  const options: UiComponentGeneratorSchema = {
    name: 'test-button',
    withStory: true,
    withTest: true,
    category: 'components',
  };

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
    // Create the target library structure that the generator expects
    tree.write(
      'libs/frontend/shared-ui/ui-components/src/index.ts',
      '// Components\n'
    );
  });

  it('should generate component file', async () => {
    await uiComponentGenerator(tree, options);

    const componentPath =
      'libs/frontend/shared-ui/ui-components/src/components/ui/test-button.tsx';
    expect(tree.exists(componentPath)).toBe(true);
  });

  it('should generate test file when withTest is true', async () => {
    await uiComponentGenerator(tree, options);

    const testPath =
      'libs/frontend/shared-ui/ui-components/src/components/ui/test-button.test.tsx';
    expect(tree.exists(testPath)).toBe(true);
  });

  it('should generate story file when withStory is true', async () => {
    await uiComponentGenerator(tree, options);

    const storyPath =
      'libs/frontend/shared-ui/ui-components/stories/components/test-button.stories.tsx';
    expect(tree.exists(storyPath)).toBe(true);
  });

  it('should update index.ts with export', async () => {
    await uiComponentGenerator(tree, options);

    const indexContent = tree.read(
      'libs/frontend/shared-ui/ui-components/src/index.ts',
      'utf-8'
    );
    expect(indexContent).toContain(
      "export * from './components/ui/test-button'"
    );
  });

  it('should not generate test file when withTest is false', async () => {
    await uiComponentGenerator(tree, { ...options, withTest: false });

    const testPath =
      'libs/frontend/shared-ui/ui-components/src/components/ui/test-button.test.tsx';
    expect(tree.exists(testPath)).toBe(false);
  });

  it('should not generate story file when withStory is false', async () => {
    await uiComponentGenerator(tree, { ...options, withStory: false });

    const storyPath =
      'libs/frontend/shared-ui/ui-components/stories/components/test-button.stories.tsx';
    expect(tree.exists(storyPath)).toBe(false);
  });
});
