import express, { Application, Request, Response } from 'express';
import { spawn } from 'child_process';
import * as fs from 'fs';
// import * as saxon from 'saxon-js';
import saxonJS from 'saxon-js';

// adesso arriva da http
// ### import { TVerbaliLayout } from '../asset/t-verbali-layout.xml';
// import { TVerbaliIFsef } from '../asset/t-verbali-if-xslt.sef';
// ### import { TVerbaliIFxslt } from '../asset/t-verbali-if-xslt.xsl.json';
// import sef from '../asset/t-verbali-if-xslt.sef.json';


class App {
    public express: Application;

    /**
     * compile
     * your absolute project path
     */
    AbsolutePath = '/your/absolute/project/path/saxon-node-22_03';


    xslt3Path = this.AbsolutePath + '/xslt3-wd';
    scriptsPath = this.AbsolutePath + '/src/asset/scripts';

    constructor() {
        this.express = express();
        this.express.use(express.json());
        this.mountRoutes();
        // adesso sotto 
        // this.saxonRenderDataNode(TVerbaliLayout, TVerbaliIFxslt);
    }

    private mountRoutes(): void {
        const router = express.Router();
        router.get('/', (req: Request, res: Response) => {
            /* res.json({
                message: 'Hello World!1'
            }) */
            res.send(this.indexPage());
        });
        /* router.get('/saxon', (req: Request, res: Response) => {
            res.send('this.indexPage()');
        }); */
        router.post('/saxon/xslt', async (req: Request, res: Response) => {
            // x debug console.log('post:::', req);
            // console.log('raw:::', req.rawHeaders);
            /* 
            console.log('c-type:::', req.headers['content-type']);
            console.log('body:::',req.body);
            console.log('originalUrl:::', req.originalUrl);
            console.log('baseUrl:::', req.baseUrl);
            console.log('url:::', req.url);
            */
            const body: { xml: string, xslt: string } = req.body;
            // console.log(body.xml);
            // console.log(body.xslt);

            // res.send('{"result": "' + this.xslt2sef(body.xml, body.xslt) + '"}');
            // diventa
            /*
            this.xslt2sef(body.xml, body.xslt, result => {
                console.log('prima send::::', result);
                res.send(`{"result": "$ {result}"}`);
            });
            */
            this.xslt2sef(body.xml, body.xslt, (result: { result: any, sef: string }) => {
                // adesso non serve fa tutto
                // const escaped = this.jsonStringEscape(result.principalResult);
                // console.log('prima send::::', result);
                // console.log(escaped, Buffer.from(escaped), 'utf-8');
                const buf = Buffer.from(result.result).toJSON();
                // console.log(buf, Buffer.from(buf.data).toString());

                res.setHeader('content-type', 'application/json');
                // !!! arriva già con "" quindi non ci vogliono per sicurezza bufferizzo ma no base64
                // no ci vuole oggetto non stringa json ->res.send(`{"result":"${Buffer.from(result.principalResult)}"}`);
                // res.send({ result: Buffer.from(result.principalResult) });
                // buffer tipo {"type":"Buffer", "data":....} ricordare toJSON
                // res.send(Buffer.from(result.result.principalResult).toJSON());
                // invio transformed and sef as Buffer
                res.send({ result: Buffer.from(result.result).toJSON(), sef: Buffer.from(result.sef).toJSON() });
                // arriva json quindi ...aspetto per problemi conversione
                // res.send(result);
            });
        });

        router.post('/saxon/sef', async (req: Request, res: Response) => {

            const body: { xml: string, xslt: string } = req.body;

            // if  xml is  mpty not transform
            this.xslt2sef('', body.xslt, (result: { result: any, sef: string }) => {

                const buf = Buffer.from(result.result).toJSON();
                // console.log(buf, Buffer.from(buf.data).toString());

                res.setHeader('content-type', 'application/json');

                res.send({ result: Buffer.from(result.result).toJSON(), sef: Buffer.from(result.sef).toJSON() });

            });
        });

        this.express.use('/', router);
    }

    indexPage(): string {
        return `
        <h1>saxon-node-22_03</h1>
        <p>
        saxon xml xsl  transform
        </p>
        <ul>
        <li>
        <a href="saxon/xmlxsl">xml/xsl -></a>
        </li>
        <li>
        <a href="saxon/xslsef">xsl -> sef</a>
        </li>
        <li>
        <a href="saxon">saxon</a>
        </li>
        </ul>
        `;
    }

    // ************************* tutto il nuovo con saxon
    saxonRenderDataNode(DataNode: string, xsltstring: string) {

        // console.log('unnooooo:::', DataNode, xsltstring);

        this.xslt2sef(DataNode, xsltstring, () => { });

        /* ok aspetto adesso sotto
        const resultStringXML = saxonJS.transform({
            stylesheetInternal: xsltstring,
            sourceText: DataNode,
            destination: 'serialized'
        });
        */

        /* se async
        saxonJS.transform({
            
            stylesheetText: xsltstring,
            sourceText: DataNode,
            // destination: "serialized"
        }, "async")
            .then((output: any) => {
                console.log('ooook::::', output);
            });
            */


        // console.log('ooook::::', resultStringXML);
    }


    /**
     * devo ricreare
     * npx xslt3 -xsl:t-verbali-if-xslt.xsl -export:t-verbali-if-xslt.sef.json -nogo
     * per il momento non ho trovato sistema per fare stream in memoria quindi per il momento da
     * 
     * @param DataNode - xml normale
     * @param xsltstring - xsl normale
     * 
     * quindi per il momento:
     * ricevuta stringa xsltstring
     * - creo/modifico file xslt3-input.xsl
     * - eseguo riga e compilo sef: npx xslt3 -xsl:xslt3-input.xsl -export:xslt3-input.sef.json -nogo
     * - chiamo transform
     * - restituisco risultato
     * 
     * ma creo script altrimenti con nvm non si ritrova
     */
    xslt2sef(DataNode: string, xsltstring: string, $callback: (result: { result: any, sef: string }) => void) {


        // console.log('unnooooo:::', DataNode, xsltstring);

        fs.writeFile(this.xslt3Path + '/xslt3-input.xsl', xsltstring, async () => {
            // solo come esempio: const xslt3 = spawn('ls', ['-la']);
            // adesso ho scritto file xsl
            // genero file sef
            const xslt3 = spawn('sh', [this.scriptsPath + '/xslt3sef.sh', this.xslt3Path]);

            // add > /dev/null to script else first data is: Now using node v16.14.0 (npm v8.3.1)
            xslt3.stdout.on('data', (data) => {
                console.log(`xslt3.spawn->stdout:\n${data}`);
                // adesso xslt ho file salvato non lo ricarico
                // xml invece in memoria
                // solo se non vuoto
                let resultStringXML: any;
                let principalResult = 'ONLY-SEF';
                if (DataNode) {
                    resultStringXML = saxonJS.transform({
                        // stylesheetInternal: xsltstring,
                        stylesheetFileName: this.xslt3Path + '/xslt3-input.sef.json',
                        sourceText: DataNode,
                        destination: 'serialized'
                    });
                    principalResult = resultStringXML.principalResult;
                }

                // recupero sef
                fs.readFile(this.xslt3Path + '/xslt3-input.sef.json', 'utf-8', (err, datasef) => {
                    if (err) {
                        console.error(err);
                        $callback({ result: `xslt3.readFile->error reading xslt3sef.sh: ${err}`, sef: 'ERROR' });
                    } else {
                        console.log('finalmente::::', principalResult);
                        $callback({ result: principalResult, sef: datasef });
                    }
                });
                // riscrivo out
                fs.writeFile(this.xslt3Path + '/xslt3-output.xml', principalResult, () => { });

            });

            xslt3.stderr.on('data', (data) => {
                console.error(`stderr: ${data}`);
                $callback({ result: `xslt3.spawn->stderr: ${data}`, sef: 'ERROR' });
            });

            xslt3.on('error', (error) => {
                console.error(`error: ${error.message}`);
                $callback({ result: `xslt3.spawn->error: ${error.message}`, sef: 'ERROR' });
            });

            xslt3.on('close', (code) => {
                console.log(`xslt3.spawn->child process exited with code ${code}`);
                // questo no altrimenti richiama $callback(`child process exited with code ${code}`);
            });


        });
    }

}

export default new App().express;
