import * as fs from 'fs-extra';
import * as pacote from 'pacote';
import * as path from 'path';
import { getDictionaryPath } from './getDictionaryPath';
import { getLanguageRegionCode } from './getLanguageRegionCode';
import { HunspellDictDownloader } from './HunspellDictDownloader';
import { initialize } from './initialize';
import { isInstalledDictionaryValid } from './isInstalledDictionaryValid';
import { CODE_LANG, CODE_LANG_REGION, DictionaryManifest, manifest } from './manifest';
import { log } from './util/logger';

const createDownloader: (initPath: string) => Promise<HunspellDictDownloader> = async (initPath: string) => {
  const dictionaryDirectory = path.resolve(initPath);
  const cacheDirectory = path.join(dictionaryDirectory, '.cache');

  const availableDictionaries: Readonly<Array<CODE_LANG_REGION>> = Object.keys(manifest) as any;
  const installedDictionaries: Readonly<Array<CODE_LANG_REGION>> = await initialize(
    dictionaryDirectory,
    availableDictionaries
  );

  const currentDownloads: { [index in CODE_LANG_REGION]: Promise<{ dic: string; aff: string }> } = {} as any;
  const clearCache = async () => fs.emptyDir(cacheDirectory);

  return {
    availableDictionaries,
    installedDictionaries,
    installDictionary: async (code: CODE_LANG_REGION | CODE_LANG) => {
      const langRegionCode = getLanguageRegionCode(code);
      if (installedDictionaries.includes(langRegionCode)) {
        return getDictionaryPath(dictionaryDirectory, langRegionCode);
      }

      if (!!currentDownloads[langRegionCode]) {
        return currentDownloads[langRegionCode];
      }

      const { packageName, version, integrity } = manifest[langRegionCode] as DictionaryManifest;
      const { installDirectory, dic, aff } = getDictionaryPath(dictionaryDirectory, langRegionCode);
      const baseOptions = { preferOnline: false, cache: cacheDirectory, log };
      const pkg = `${packageName}@${version}`;

      const install = async () => {
        try {
          await pacote.extract(pkg, installDirectory, { ...baseOptions, integrity });

          const isValid = await isInstalledDictionaryValid(dictionaryDirectory, langRegionCode);
          if (!isValid) {
            await clearCache();
            throw new Error('Dictionary is installed, but failed to check integrity');
          }

          installedDictionaries.push(langRegionCode);
          return { dic, aff };
        } finally {
          delete currentDownloads[langRegionCode];
        }
      };

      return (currentDownloads[langRegionCode] = install());
    },
    uninstallDictionary: async (code: CODE_LANG_REGION | CODE_LANG) => {
      const langRegionCode = getLanguageRegionCode(code);
      const { installDirectory } = getDictionaryPath(dictionaryDirectory, langRegionCode);

      try {
        await fs.emptyDir(installDirectory);
      } finally {
        installedDictionaries.splice(
          installedDictionaries.indexOf(langRegionCode),
          installedDictionaries.includes(langRegionCode) ? 1 : 0
        );
      }
    },
    clearCache
  };
};

export { HunspellDictDownloader, createDownloader };
