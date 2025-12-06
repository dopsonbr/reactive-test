import {
  Tree,
  formatFiles,
  generateFiles,
  names,
  joinPathFragments,
} from '@nx/devkit';
import * as path from 'path';
import { UiComponentGeneratorSchema } from './schema';

export async function uiComponentGenerator(
  tree: Tree,
  options: UiComponentGeneratorSchema
) {
  const componentNames = names(options.name);
  const componentDir = joinPathFragments(
    'libs/shared-ui/ui-components/src/components/ui'
  );
  const storyDir = joinPathFragments(
    'libs/shared-ui/ui-components/stories',
    options.category
  );

  // Generate component file
  generateFiles(tree, path.join(__dirname, 'files/component'), componentDir, {
    ...componentNames,
    description: options.description || `${componentNames.className} component`,
    tmpl: '',
  });

  // Generate test file if requested
  if (options.withTest) {
    generateFiles(tree, path.join(__dirname, 'files/test'), componentDir, {
      ...componentNames,
      tmpl: '',
    });
  }

  // Generate story if requested
  if (options.withStory) {
    generateFiles(tree, path.join(__dirname, 'files/story'), storyDir, {
      ...componentNames,
      category: options.category,
      tmpl: '',
    });
  }

  // Update index.ts exports
  const indexPath = 'libs/shared-ui/ui-components/src/index.ts';
  const indexContent = tree.read(indexPath, 'utf-8') || '';
  const exportLine = `export * from "./components/ui/${componentNames.fileName}";\n`;

  if (!indexContent.includes(exportLine)) {
    // Find the "// Components" comment and add after it
    const componentsComment = '// Components\n';
    if (indexContent.includes(componentsComment)) {
      const newContent = indexContent.replace(
        componentsComment,
        componentsComment + exportLine
      );
      tree.write(indexPath, newContent);
    } else {
      // Just append if no comment found
      tree.write(indexPath, exportLine + indexContent);
    }
  }

  await formatFiles(tree);

  return () => {
    console.log(`
Component ${componentNames.className} generated!

Files created:
  - src/components/ui/${componentNames.fileName}.tsx
  ${options.withTest ? `- src/components/ui/${componentNames.fileName}.test.tsx` : ''}
  ${options.withStory ? `- stories/${options.category}/${componentNames.fileName}.stories.tsx` : ''}

Next steps:
  1. Implement component logic
  2. Add CVA variants
  3. Run tests: pnpm nx test ui-components
  4. View in Ladle: pnpm nx ladle ui-components
    `);
  };
}

export default uiComponentGenerator;
