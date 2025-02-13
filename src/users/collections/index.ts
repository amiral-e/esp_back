import { Hono } from "hono";

import collection_delete from "./collection_delete";
import collections_get from "./collections_get";

const collections = new Hono();

collections.route("/", collection_delete);
collections.route("/", collections_get);

export default collections;
