import { endTimingLog, startTimingLog } from '@ansyn/core/utils';

export abstract class BaseMapSourceProvider {

	abstract mapType: string;

	abstract sourceType: string;

	abstract create(metaData: any): any;

	createAsync(metaData: any): Promise<any> {
		return Promise.resolve();
	};

	startTimingLog(id) {
		startTimingLog(id);
	}

	endTimingLog(id) {
		endTimingLog(id);
	}
}
