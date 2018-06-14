import { Plugin, Compiler, ProvidePlugin, Entry } from "webpack";
import { Config } from "./config";
import * as fs from "fs";
import * as path from "path";

import globalizeCompiler = require('globalize-config-compiler');

class Consts {
    public static readonly NOT_FOUND = -1;
    public static readonly GLOBALIZE_RUNTIME = "globalize-runtime";
    public static readonly DEFAULT_JQUERY_VALIDATE_GLOBALIZE_NAME = "jquery-validation-globalize";
}

class GlobalizeJqueryValidatePlugin implements Plugin {
    
    private readonly config: Config;

    constructor(config: Config) {
        this.config = config;
    }

    apply(compiler: Compiler): void {

        const compilerConfig = {
            "availableLocales": this.config.locales,
            "dateParsers": [
                null,
                { "skeleton": "yMd" }
            ],
            "numberParsers": [
                null
            ]
        };


        if (!compiler.options.resolve) {
            compiler.options.resolve = {};
        }

        if (!compiler.options.resolve.alias) {
            compiler.options.resolve.alias = {};
        }

        compiler.options.resolve.alias[Consts.GLOBALIZE_RUNTIME] = "globalize/dist/globalize-runtime";
             
        var entry = compiler.options.entry;

        if (!Array.isArray(entry)) {

            if (typeof entry === "object") {
                entry = entry[Object.keys(entry)[0]];
            }

            if (!Array.isArray(entry)) {
                throw new Error("unsupported entry format");
            }
        }

        const globalizeIndex = entry.indexOf("globalize");

        if (globalizeIndex !== Consts.NOT_FOUND) {
            entry.splice(globalizeIndex, 1, Consts.GLOBALIZE_RUNTIME);
        } else {
            if (entry.indexOf(Consts.GLOBALIZE_RUNTIME) === Consts.NOT_FOUND) {
                entry.push(Consts.GLOBALIZE_RUNTIME);
            }
        }

        const compiled = globalizeCompiler(compilerConfig);

        for (var locale in compiled) {
            const filePath = path.posix.join(this.config.tempDirPath, locale + '-locale.js');
            fs.writeFileSync(filePath, compiled[locale].replace(/return Globalize;/, "return new Globalize(\"" + locale + "\");"));
            // path.join removes ./ at the start of the path
            entry.push("./" + filePath);
        }

        entry.push(Consts.DEFAULT_JQUERY_VALIDATE_GLOBALIZE_NAME);

        compiler.hooks.compile.tap('globalize-jquery-validate-webpack', compilation => {
            new ProvidePlugin({
                'Globalize': Consts.GLOBALIZE_RUNTIME
            }).apply(compiler);
        });

    }

}

export = GlobalizeJqueryValidatePlugin;