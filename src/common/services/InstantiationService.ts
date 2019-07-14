/**
 * Copyright (c) 2019 The xterm.js authors. All rights reserved.
 * @license MIT
 */

import { IInstantiationService, IServiceIdentifier } from 'common/services/Services';
import { getServiceDependencies } from 'common/services/ServiceRegistry';

declare const console: any;

export class ServiceCollection {

  private _entries = new Map<IServiceIdentifier<any>, any>();

  constructor(...entries: [IServiceIdentifier<any>, any][]) {
    for (const [id, service] of entries) {
      this.set(id, service);
    }
  }

  set<T>(id: IServiceIdentifier<T>, instance: T): T {
    const result = this._entries.get(id);
    this._entries.set(id, instance);
    return result;
  }

  forEach(callback: (id: IServiceIdentifier<any>, instance: any) => any): void {
    this._entries.forEach((value, key) => callback(key, value));
  }

  has(id: IServiceIdentifier<any>): boolean {
    return this._entries.has(id);
  }

  get<T>(id: IServiceIdentifier<T>): T {
    return this._entries.get(id);
  }
}

export class InstantiationService implements IInstantiationService {
  private readonly _services: ServiceCollection = new ServiceCollection();

  constructor() {
    this._services.set(IInstantiationService, this);
  }

  public setService<T>(id: IServiceIdentifier<T>, instance: T): void {
    this._services.set(id, instance);
  }

  public createInstance<T>(ctor: any, ...args: any[]): any {
    const serviceDependencies = getServiceDependencies(ctor).sort((a, b) => a.index - b.index);

		let serviceArgs: any[] = [];
		for (const dependency of serviceDependencies) {
			let service = this._services.get(dependency.id);
			if (!service) {
				throw new Error(`[createInstance] ${ctor.name} depends on UNKNOWN service ${dependency.id}.`);
			}
			serviceArgs.push(service);
		}

		let firstServiceArgPos = serviceDependencies.length > 0 ? serviceDependencies[0].index : args.length;

		// check for argument mismatches, adjust static args if needed
		if (args.length !== firstServiceArgPos) {
			console.warn(`[createInstance] First service dependency of ${ctor.name} at position ${
				firstServiceArgPos + 1} conflicts with ${args.length} static arguments`);

			let delta = firstServiceArgPos - args.length;
			if (delta > 0) {
				args = args.concat(new Array(delta));
			} else {
				args = args.slice(0, firstServiceArgPos);
			}
		}
    console.log('args', args, 'serviceArgs', serviceArgs);
		// now create the instance
		return <T>new ctor(...[...args, ...serviceArgs]);
  }
}
