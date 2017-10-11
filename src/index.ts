import {
  AppDecorator,
  InjectDecorator,
  PluginsDecorator,
  PluginDecorator,
  PluginConfiguratorDecorator,
  ModuleDecorator,
  RouteDecorator,
  ParamNumberDecorator,
  RequestAttributeDecorator,
  RequireRequestAttributeDecorator,
  ReplyAttributeDecorator,
  RequestDecorator,
  ParamDecorator
} from './core/decorators';

import {
  IApp,
  IModule,
  IPlugin,
  IPluginConfigurator,
  IPluginOptions,
  IBootstrapOptions,
} from './core/interfaces';

import {bootstrap, bootstrapWithOptions} from './core/bootstrap';

import {Interceptor, AbstractServer} from './core/context'
import {Injector} from "./core/injector.class";

export {
  bootstrap,
  bootstrapWithOptions,
  AppDecorator as App,
  InjectDecorator as Inject,
  PluginsDecorator as Plugins,
  PluginDecorator as Plugin,
  PluginConfiguratorDecorator as PluginConfigurator,
  ModuleDecorator as Controller,
  ModuleDecorator as Module, //@deprecated
  RouteDecorator as Route,

  IApp, // @deprecated
  IApp as IServer,
  IModule as IController,
  IPlugin,
  IPluginConfigurator,
  IPluginOptions,
  IBootstrapOptions,
  Injector,

  Interceptor,
  AbstractServer,

  ParamNumberDecorator as param_number,
  RequestAttributeDecorator as request_attr,
  RequireRequestAttributeDecorator as require_request_attr,
  RequestDecorator as request,
  ReplyAttributeDecorator as reply,
  ParamDecorator as param
};
