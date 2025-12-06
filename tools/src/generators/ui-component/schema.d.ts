export interface UiComponentGeneratorSchema {
  name: string;
  description?: string;
  withStory: boolean;
  withTest: boolean;
  category: 'foundations' | 'components' | 'patterns';
}
