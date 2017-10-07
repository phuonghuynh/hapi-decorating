import { IStatic } from './interfaces';
import {Container} from "typedi";

export class Injector extends Container{

  public get<T>(Dependency: IStatic<T> | T): T {
    if (Dependency instanceof Function) {
      return new Dependency();
    }
    return Dependency;
  }

}
