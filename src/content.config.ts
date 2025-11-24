import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';

export const collections = {
	docs: {
		loader: docsLoader(),
		schema: docsSchema()
	},
};
