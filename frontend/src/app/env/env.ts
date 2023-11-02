import { isDevMode } from '@angular/core';

const variables = {
	production:{
		API_URL: 'https://function-wars-api.azurewebsites.net',
	},
	development:{
		API_URL: 'http://localhost:3000',
	}
};

export default isDevMode() ? variables.development : variables.production;