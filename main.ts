import pup from "puppeteer";
import qs from "qs";
import express from "express";
import { Tagged, Untagged } from "./tagged";
import { match } from "ts-pattern";

const downloadButton = "//button[contains(., 'Download')]";

type zipFileUrlObjec = {
  url: string;
  method: string;
  headers: Record<string, string>;
  postData: Record<string, string>;
};

namespace Link {
  export interface Zip extends Tagged<"Zip"> {
    urlObject: zipFileUrlObjec;
  }
  export const Zip = (spec: Untagged<Zip>): Zip => ({ ...spec, _tag: "Zip" });

  export interface SingleFile extends Tagged<"SingleFile"> {
    url: string;
    headers: Record<string, string>;
  }
  export const SingleFile = (spec: Untagged<SingleFile>): SingleFile => ({
    ...spec,
    _tag: "SingleFile",
  });
}

type Link = Link.Zip | Link.SingleFile;

const getZipFileUrlObject = async (
  url: string,
  onFoundLink: (link: Link) => void
) => {
  const browser = await pup.launch({ headless: false });

  const page = await browser.newPage();
  await page.setViewport({ width: 2000, height: 1024 });

  await page.setRequestInterception(true);

  page.on("request", (interceptedRequest) => {
    if (interceptedRequest.isInterceptResolutionHandled()) return;
    const url_ = interceptedRequest.url();

    if (url_.includes("zip")) {
      const obj = {
        url: interceptedRequest.url(),
        method: interceptedRequest.method(),
        headers: interceptedRequest.headers(),
        postData: interceptedRequest.postData(),
      };

      onFoundLink(
        Link.Zip({
          urlObject: {
            ...obj,
            postData: qs.parse(obj.postData!.toString()) as Record<
              string,
              string
            >,
          },
        })
      );

      interceptedRequest.abort();
      browser.close();
    } else if (url_.includes("download")) {
      const headers = interceptedRequest.headers();

      onFoundLink(Link.SingleFile({ url: url_, headers }));

      interceptedRequest.abort();
      browser.close();
    } else if (
      url_.endsWith(".png") ||
      url_.endsWith(".svg") ||
      url_.endsWith(".woff") ||
      url_.endsWith(".jpg")
    ) {
      interceptedRequest.abort();
    } else {
      interceptedRequest.continue();
    }
  });

  await page.goto(url);

  await page.waitForXPath(downloadButton);

  let button = (await page.$x(downloadButton))[0];
  await (await button.toElement("button")).click();
};

const mkPythonGetRequest = (url: string, headers: Record<string, string>) =>
  `requests.get('${url}', headers=${JSON.stringify(headers)})`;

const mkPythonPostRequest = (urlObject: zipFileUrlObjec) =>
  `requests.post('${urlObject.url}', headers=${JSON.stringify(
    urlObject.headers
  )}, data=${JSON.stringify(urlObject.postData)})`;

const app = express();

app.use(express.urlencoded({ extended: true }));

app.post<never, any, { url: string }>("/download", (req, res) => {
  getZipFileUrlObject(req.body.url, (link) =>
    match(link)
      .with({ _tag: "SingleFile" }, ({ url, headers }) =>
        res.send({ url, headers, METHOD: "GET" })
      )
      .with({ _tag: "Zip" }, ({ urlObject }) =>
        res.send({ ...urlObject, METHOD: "POST" })
      )
  );
});

// "https://uwin365.sharepoint.com/:f:/s/cshfrg-TeamFormation/Egwn-uzzJtNEsTM3cKOpM2gBQpcF3_qrZcs-DzIg_j7hsg"

app.listen(3000, () => console.log("listening on 3000"));
