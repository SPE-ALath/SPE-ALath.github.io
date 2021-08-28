<script runat="server" language="javascript">
    Platform.Load("Core", "1.1.5");
    Platform.Function.ContentBlockByKey('email360-ssjs-lib');

    try{
        
        debugMode = ['console'];
        
        
        var languages = Platform.Function.LookupRows('ENT.CA-520000847-ISG-Language',['LU'],['1']);
        languages.foreach(function(){
            queryRootParent = getParentFolders("0",null,"queryactivity");
            debug(queryRootParent);
        });
        
        
        
        
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
    
    function getParentFolders(folderID,folderName,contentType){
        var prox = new Script.Util.WSProxy();
        var cols = ["ID","Name","ParentFolder.ID"];
        var filter = null;
        if(folderID == null && folderName == null)
        {
            return null;
        }
        elseif(folderID == null)
        {
            filter = {
               LeftOperand: {
                  Property: "Name", 
                  SimpleOperator: "equals", 
                  Value: folderName
               },
               LogicalOperator: "AND",
               RightOperand: {
                  Property: "ContentType", 
                  SimpleOperator: "equals", 
                  Value: contentType
               }
            };
        }
        else
        {
            filter = {
               LeftOperand: {
                  Property: "ID", 
                  SimpleOperator: "equals", 
                  Value: folderID
               },
               LogicalOperator: "AND",
               RightOperand: {
                  Property: "ContentType", 
                  SimpleOperator: "equals", 
                  Value: contentType
               }
            };
        }
        var data = prox.retrieve("DataFolder", cols, filter);
        return data.Results;
    }
</script>
