const KalturaClientFactory = require("./kalturaClientFactory");
const kaltura = require('kaltura-client');

class KalturaImageUploader {
    constructor() {
        return (async () => {
            this.ks = await KalturaClientFactory.getKS('',{ type: kaltura.enums.SessionType.ADMIN })
            this.client = await KalturaClientFactory.getClient(this.ks)
            return this; 
        })();
    }

    upload(filePath,done) {
        this.filePath = filePath;
        this.done = done;
        let uploadToken = new kaltura.objects.UploadToken();
        kaltura.services.uploadToken.add(uploadToken)
            .execute(this.client)
            .then(result => {
                this.uploadTokenId = result.id;
                this.doUpload(result.id)
            });
    }

    doUpload(uploadTokenId) {
        let resume = false;
        let finalChunk = true;
        let resumeAt = -1;

        kaltura.services.uploadToken.upload(uploadTokenId, this.filePath, resume, finalChunk, resumeAt)
            .execute(this.client)
            .then(result => {
                this.createMediaEntry();
            });
    }

    createMediaEntry() {
        let entry = new kaltura.objects.MediaEntry();
        entry.mediaType = kaltura.enums.MediaType.IMAGE;

        kaltura.services.media.add(entry)
            .execute(this.client)
            .then(result => {
                this.addContent(result.id);
            });
    }

    addContent(entryId) {
        let resource = new kaltura.objects.UploadedFileTokenResource();
        resource.token = this.uploadTokenId;
        kaltura.services.media.addContent(entryId, resource)
            .execute(this.client)
            .then(result => {
                this.done(result);
            });
    }
};

module.exports = KalturaImageUploader;