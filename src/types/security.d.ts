declare module "express-mongo-sanitize" {
  import { RequestHandler } from "express";
  function mongoSanitize(): RequestHandler;
  export = mongoSanitize;
}

declare module "xss-clean" {
  import { RequestHandler } from "express";
  function xss(): RequestHandler;
  export = xss;
}

declare module "hpp" {
  import { RequestHandler } from "express";
  function hpp(): RequestHandler;
  export = hpp;
}
