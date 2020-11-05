#!/usr/bin/env node

import isCameraOn from 'is-camera-on';
import Wemo from 'wemo-client';
import { interval, from, Observable, Observer, combineLatest } from 'rxjs';
import { distinctUntilChanged, map, startWith, switchMap, filter, tap } from 'rxjs/operators';

const deviceSerialToFind = '221547K11000ED';

const wemo = new Wemo();

const wemoDiscoveredDevice$ = new Observable(
	(observer: Observer<IWemoDeviceInfo>) => {
		wemo.discover((err: unknown, deviceInfo: IWemoDeviceInfo) => {
			if (err) {
				observer.error(err);
				return;
			}
			observer.next(deviceInfo);
		});
	}
).pipe(
	distinctUntilChanged((a, b) => a.serialNumber == b.serialNumber),
	tap({ next: deviceInfo => console.log(`Wemo discovered : ${deviceInfo.friendlyName} : ${deviceInfo.serialNumber}`) }),
)

const wemoLight$ = wemoDiscoveredDevice$.pipe(
	filter(device => device.serialNumber == deviceSerialToFind),
	map((d) => wemo.client(d)),
)

const isCamOn$ = interval(1000)
	.pipe(
		startWith(0),
		switchMap(() =>
			from(isCameraOn()).pipe(map(i => i as boolean))
		),
		distinctUntilChanged(),
		tap({ next: isCamOn => console.debug(`webcam is ${isCamOn ? 'on' : 'off'}`) }),
	)

combineLatest([wemoLight$, isCamOn$])
	.subscribe(([wemoLight, isCamOn]) => {
		wemoLight.setBinaryState((+!!isCamOn).toString() as "1" | "0");
	})