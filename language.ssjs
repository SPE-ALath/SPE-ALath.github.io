<script runat="server" language="javascript">
    Platform.Load("Core", "1.1.5");
    Platform.Function.ContentBlockByKey('email360-ssjs-lib');
    // var prox = new Script.Util.WSProxy();

    try{
        debugMode = ['console'];
        
        var languages = Platform.Function.LookupRows('ENT.CA-520000847-ISG-Language',['LU'],['1']);
        debug(languages);
        var languageLength = languages.length;
        // var rootQueryActivityFolders = getParentFolders(0,null,"queryactivity");
        // debug(rootQueryActivityFolders);
        for(var i=0; i<languageLength; i++)
        {
            debug(languages[i].LanguageKey);
        }
        
    } catch(e){
        // workaround for Thread Abort Exception from redirect
        var desc = e.description; //Pulls the description from error object
        if(desc.includes("ExactTarget.OMM.AMPScriptRedirectException: Error in the application. - from")) {
            Platform.Response.Write(desc); //This is arbitrary as will not be run
        } else {
            // redirect error page
            cp.redirectError({
                errorCode: 500,
                errorDebug: Platform.Function.Stringify(e)
            });
        }
    }

    function getParentFolders(folderID, folderName, contentType)
    {
        Write(Stringify(folderID));
    }

</script>
