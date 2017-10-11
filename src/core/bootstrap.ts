import 'reflect-metadata';
import * as Hapi from 'hapi';
import {Injector} from './injector.class';
import {
  IApp,
  IAppStatic,
  IBootstrapOptions,
  IMappingType,
  IModule,
  IModuleConfig,
  IModuleStatic,
  IPlugin,
  IPluginConfiguratorStatic,
  IPluginStatic,
  MType
} from './interfaces';

import * as _ from 'lodash';
import * as Boom from "boom";

const DEFAULT_APP_CONFIG = {
  port: 3000
};

const DEFAULT_BOOTSTRAP_OPTIONS = {
  injector: new Injector()
};

export function bootstrapWithOptions(BootstrapedApps: Array<IAppStatic>,
                                     options: IBootstrapOptions = DEFAULT_BOOTSTRAP_OPTIONS): Array<IApp> {
  const apps: Array<IApp> = [];
  for (const BootstrapedApp of BootstrapedApps) {
    const server: Hapi.Server = new Hapi.Server();
    const app: IApp = new BootstrapedApp(server);

    server.connection(_.extend(Reflect.getMetadata('hapiour:config', BootstrapedApp), DEFAULT_APP_CONFIG));
    _.invoke(app, 'onInit');
    const plugins: Array<IPlugin> = getPluginsRecurs(options.injector, Reflect.getMetadata('hapiour:plugins', BootstrapedApp));
    const routes: Array<Hapi.RouteConfiguration> = getRoutesWithConfigRecurs(options.injector, BootstrapedApp, server);
    if (_.isEmpty(plugins)) {
      _.invoke(app, 'onRegister');
      server.route(routes);
      server.start((err: any) => {
        if (err) {
          throw new Error(err);
        }
        _.invoke(app, 'onStart');
      });
    } else {
      server.register(plugins, (registerErr: any) => {
        if (registerErr) {
          throw new Error(registerErr);
        }
        _.invoke(app, 'onRegister');
        server.route(routes);
        server.start((startErr: any) => {
          if (startErr) {
            throw new Error(startErr);
          }
          _.invoke(app, 'onStart');
        });
      });
    }
    apps.push(app);
  }
  return apps;
}

function getPluginsRecurs(injector: Injector, Plugins: Array<IPluginStatic | IPlugin | IPluginConfiguratorStatic>): Array<IPlugin> {
  let plugins: Array<IPlugin> = [];
  if (_.isArray(Plugins)) {
    for (const Plugin of Plugins) {
      if (Plugin instanceof Array) {
        plugins = _.concat(plugins, getPluginsRecurs(injector, Plugin));
      } else if (Plugin['register']) {
        plugins.push(<IPlugin>Plugin);
      } else {
        const plugin: IPlugin = injector.get<IPlugin>(<IPluginStatic>Plugin);
        if (Reflect.hasMetadata('hapiour:register', Plugin)) {
          plugin.register = Reflect.getMetadata('hapiour:register', Plugin);
        } else if (Reflect.hasMetadata('hapiour:attributes', Plugin)) {
          plugin.register = plugin.register.bind(plugin);
          plugin.register.attributes = Reflect.getMetadata('hapiour:attributes', Plugin);
        }
        plugins.push(plugin);
      }
    }
  }
  return plugins;
}


function getMappingArgs(request: Hapi.Request, reply: any, target: any) {
  if (!Reflect.hasMetadata('hapiour:mappings', target)) {
    return [];
  }

  let mapping_types: IMappingType[] = Reflect.getOwnMetadata("hapiour:mappings", target);
  if (!request.params) {
    return [];
  }

  let args = [];
  mapping_types.forEach((mappingType: IMappingType) => {
    switch (mappingType.type) {
      case MType.req_attr:
        args.unshift(request[mappingType.param_name]);
        break;

      case MType.require_req_attr:
        let value = request[mappingType.param_name];
        if (!value) {
          throw Boom.badData(`${mappingType.param_name} is required`);
        }
        args.unshift(value);
        break;

      case MType.reply:
        args.unshift(reply);
        break;

      case MType.request:
        args.unshift(request);
        break;

      default:
        let val: string = request.params[mappingType.param_name];
        if (mappingType.parse_it instanceof Function) {
          args.unshift(mappingType.parse_it(val));
        }
        else {
          args.unshift(val);
        }
    }
  });
  return args;
}

// function isPromise(obj) {
//   return !!obj.then && typeof obj.then === 'function';
// }

function overrideModuleHandler(injector, server: Hapi.Server, mod: IModule, route: Hapi.RouteConfiguration, interceptors): void {
  // let config: any = route.config || {};
  let pre = _.get(route, 'config.pre', []);
  interceptors = interceptors || [];

  for (let interceptor of interceptors) {
    if (_.isArray(interceptor)) {
      return overrideModuleHandler(injector, server, mod, route, interceptor);
    }

    let instance = injector.get(interceptor);
    pre.unshift({
      method: (request, reply) => execute(instance.intercept, instance, request, reply),
      // assign: 'hapiour'
    });
  }

  route.config = _.get(route, 'config', {});
  (route.config as Hapi.RouteAdditionalConfigurationOptions).pre = pre;

  let originalHandler: Function = <Function>route.handler;
  route.handler = (request, reply) => execute(originalHandler, mod, request, reply);
}

function execute(fn, thisArg, request, reply) {
  try {
    let args = getMappingArgs(request, reply, fn);

    // if (isPromise(fn)) {
      fn.apply(thisArg, args)
        .then((rsp) => {
          try {
            reply(rsp);
          }
          catch (e) {} //to prevent warning reply twice sometime
        })
        .catch((e) => reply(e));
    // }
    // else {
    //   let rsp = fn.apply(thisArg, args);
    //   if (rsp) {
    //     reply(rsp);
    //   }
    // }
    // let rsp = fn.apply(thisArg, args);
    // if (rsp) {
    //   reply(rsp);
    // }
  }
  catch (e) {
    console.error(e);
    reply(e);
  }
}

function getRoutesWithConfigRecurs(injector: Injector,
                                   item: IAppStatic | IModuleStatic,
                                   server: Hapi.Server,
                                   parent?: IAppStatic | IModuleStatic): Array<Hapi.RouteConfiguration> {
  let routes: Array<Hapi.RouteConfiguration> = [];
  if (Reflect.hasMetadata('hapiour:modules', item)) {
    const modules: Array<IModuleStatic> = Reflect.getMetadata('hapiour:modules', item);

    const parentConfig: IModuleConfig = (parent) ? Reflect.getMetadata('hapiour:config', parent) : {};

    for (const Mod of modules) {
      const config: IModuleConfig = Reflect.getMetadata('hapiour:config', Mod);
      let modRoutes: Array<Hapi.RouteConfiguration> = _.cloneDeep(Reflect.getMetadata('hapiour:routes', Mod));
      const mod: IModule = injector.get<IModule>(Mod);
      modRoutes = _.each(modRoutes, (route: Hapi.RouteConfiguration) => {
        route.path = _.get(parentConfig, 'basePath', '') + config.basePath + route.path;

        overrideModuleHandler(injector, server, mod, route, config.interceptors);
      });

      routes = _.concat(routes, modRoutes, getRoutesWithConfigRecurs(injector, Mod, server, item));
    }
  }

  return routes;
}

export function bootstrap(...BootstrapedApps: Array<IAppStatic>): Array<IApp> {
  return bootstrapWithOptions(BootstrapedApps);
}
