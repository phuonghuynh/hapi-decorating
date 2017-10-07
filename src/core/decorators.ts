import 'reflect-metadata';
import {RouteConfiguration, ServerConnectionOptions} from 'hapi';
import {IPlugin, IPluginStatic, IPluginConfiguratorStatic, IModule, IModuleConfig, IMappingType, MType} from './interfaces';
import * as Boom from "boom";

export function AppDecorator(config: ServerConnectionOptions): Function {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {

    Reflect.defineMetadata('hapiour:config', config, target);

  };
}

export function InjectDecorator(Modules: Array<IModule>): Function {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {

    Reflect.defineMetadata('hapiour:modules', Modules, target);

  };
}

export function PluginsDecorator(Plugins: Array<IPluginStatic | IPlugin | IPluginConfiguratorStatic>): Function {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {

    Reflect.defineMetadata('hapiour:plugins', Plugins, target);

  };
}

export function PluginDecorator(attributes: any): Function {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {

    Reflect.defineMetadata('hapiour:attributes', attributes, target);

  };
}

export function PluginConfiguratorDecorator(Plugin: any): Function {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {

    Reflect.defineMetadata('hapiour:register', Plugin, target);

  };
}

export function ModuleDecorator(config: IModuleConfig): Function {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {

    Reflect.defineMetadata('hapiour:config', config, target);

  };
}

// export function RouteDecorator(config: RouteConfiguration): Function {
export function RouteDecorator(route: RouteConfiguration): Function {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {

    let routes: Array<RouteConfiguration> = [];
    if (Reflect.hasMetadata('hapiour:routes', target.constructor)) {
      routes = Reflect.getMetadata('hapiour:routes', target.constructor);
    }
    route.handler = descriptor.value;
    routes.push(route);
    Reflect.defineMetadata('hapiour:routes', routes, target.constructor);

  };
}

function getArgs(func: Function) {
  let args = func.toString().match(/\(([^)]*)\)/)[1];
  return args.split(',').map(function (arg) {
    return arg.replace(/\/\*.*\*\//, '').trim();
  }).filter(function (arg) {
    return arg;
  });
}

export function MappingsDecorator(target: any, propertyKey: string | symbol, index: number, type?: MType, parse_it?: any) {
  let args: string[] = getArgs(target[propertyKey]);

  let mapping_types: IMappingType[] = [];

  if (Reflect.hasMetadata('hapiour:mappings', target[propertyKey])) {
    mapping_types = Reflect.getOwnMetadata('hapiour:mappings', target[propertyKey]) || [];
  }

  mapping_types.push({
    param_name: args[index],
    type: type,
    parse_it: parse_it
  });

  Reflect.defineMetadata('hapiour:mappings', mapping_types, target[propertyKey]);
}

export function ParamNumberDecorator(target: any, propertyKey: string | symbol, index: number) {
  MappingsDecorator(target, propertyKey, index, MType.param, (v) => {
    if (!v) {
      return undefined;
    }

    let num = parseInt(v);
    if (isNaN(num)) {
      throw Boom.badData(`${v} is not a Number`, v);
    }
    return num;
  });
}

export function RequestAttributeDecorator(target: any, propertyKey: string | symbol, index: number) {
  MappingsDecorator(target, propertyKey, index, MType.req_attr);
}

export function ParamDecorator(target: any, propertyKey: string | symbol, index: number) {
  MappingsDecorator(target, propertyKey, index, MType.param);
}

export function RequireRequestAttributeDecorator(target: any, propertyKey: string | symbol, index: number) {
  MappingsDecorator(target, propertyKey, index, MType.require_req_attr);
}

export function RequestDecorator(target: any, propertyKey: string | symbol, index: number) {
  MappingsDecorator(target, propertyKey, index, MType.request);
}

export function ReplyAttributeDecorator(target: any, propertyKey: string | symbol, index: number) {
  MappingsDecorator(target, propertyKey, index, MType.reply);
}

