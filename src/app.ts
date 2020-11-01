#!/usr/bin/env node

import isCameraOn from 'is-camera-on';
import Wemo from 'wemo-client';
import { interval, from, Observable, Observer, combineLatest } from 'rxjs';
import { distinctUntilChanged, map, startWith, switchMap } from 'rxjs/operators';

const lightId = '221547K11000ED';

const wemo = new Wemo();

const device$ = new Observable(
	(observer: Observer<WemoClient>) => {
		wemo.discover((err:unknown , deviceInfo:IWemoDeviceInfo) => {
			if (deviceInfo.serialNumber == lightId) {
				observer.next(wemo.client(deviceInfo));
			}
		});
	} 
).pipe(distinctUntilChanged());

const cameraState$ = interval(1000)
	.pipe(
		startWith(0),
		switchMap(() => 
			from(isCameraOn())
				.pipe(map((i:unknown) => i == true ? true : false))
		),
		distinctUntilChanged(),
	);

combineLatest([device$, cameraState$])
	.subscribe(([wemoClient, isCamOn]) => { 
		console.debug(isCamOn);
		wemoClient.setBinaryState(isCamOn ? '1' : '0');
	});