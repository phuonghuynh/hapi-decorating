import * as Hapi from 'hapi';
import {Injector} from "./injector.class";
import {Interceptor} from "./context";
import * as Boom from "boom";

export type IPluginOptions = Object;

export interface IStatic<T> {
  new(...args: Array<any>): T;
}

// export interface IInjector {
//   get<T>(Dependency: IStatic<T>): T;
// }

export interface IRegister {
  (server: Hapi.Server, options: IPluginOptions, next: () => void): void;

  attributes?: any;
}

export interface IPlugin {
  register: IRegister;
}

export interface IPluginStatic extends IStatic<IPlugin> {
  new(): IPlugin;
}

export interface IPluginConfigurator {
  options: IPluginOptions;
}

export interface IPluginConfiguratorStatic extends IStatic<IPluginConfigurator> {
  new(): IPluginConfigurator;
}

export interface IAppConfig {
  port: number;
}

export interface IAppStatic extends IStatic<IApp> {
  new(server: Hapi.Server): IApp;
}

export interface IApp {
  onInit?(): void;

  onRegister?(): void;

  onStart?(): void;
}

export interface IModuleStatic extends IStatic<IModule> {
  new(): IModule;
}

export interface IModule {
}

export interface IInterceptorStatic extends IStatic<Interceptor> {
  new(): Interceptor;
}

// export interface IInterceptor {
//   intercept(...args: any[]): void;
//   error_handler?(error: Error, request: Hapi.Request, reply: Hapi.ReplyNoContinue): void;
// }

// export interface IRoute {
//   config: Hapi.RouteConfiguration;
//   interceptors?: Array<Interceptor | IInterceptorStatic>;
// }

export interface IModuleConfig {
  basePath: string;
  interceptors?: Array<Interceptor | IInterceptorStatic>
}

export interface IBootstrapOptions {
  injector?: Injector;
}

export enum MType {param, req_attr, require_req_attr, request, reply}

export interface IMappingType {
  param_name: string;
  type?: MType;
  parse_it?: any;
}
