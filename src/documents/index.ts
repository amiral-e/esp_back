import { Hono } from "hono";

import document_post from "./document_post";
import document_delete from "./document_delete";
import documents_get from "./documents_get";

const documents = new Hono();

documents.route("/", document_post);
documents.route("/", document_delete);
documents.route("/", documents_get);

export default documents;
