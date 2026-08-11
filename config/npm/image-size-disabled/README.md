# Disabled image-size dependency

PptxGenJS 4.0.1 declares `image-size` as a runtime dependency, but its shipped
CommonJS and ESM bundles do not import it. The app's PPTX export uses the browser
bundle and passes already-sized image data.

All published `image-size` releases are affected by
GHSA-w3rx-r6r6-pgpr and GHSA-5p2g-fcmc-qvqq, and no patched release exists.
This local package replaces only PptxGenJS's unused dependency and fails closed
if a future PptxGenJS release starts importing it. Remove the override when
PptxGenJS no longer declares `image-size` or a patched upstream release exists.
