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
        
        
        var parentFolderID = 0;
        var prox = new Script.Util.WSProxy();
        var cols = [ "Name","ContentType","ID","CustomerKey"];
        var filter = {
           LeftOperand: {
              Property: "ParentFolder.ID", 
              SimpleOperator: "equals", 
              Value: parentFolderID
           },
           LogicalOperator: "AND",
           RightOperand: {
              Property: "ContentType", 
              SimpleOperator: "equals", 
              Value: 'dataextension'
           }
        };
        var data = prox.retrieve("DataFolder", cols, filter);
        debug(data);
        
        parentFolderID = 0;
        prox = new Script.Util.WSProxy();
        cols = [ "Name","ContentType","ID","CustomerKey"];
        filter = {
           LeftOperand: {
              Property: "ParentFolder.ID", 
              SimpleOperator: "equals", 
              Value: parentFolderID
           },
           LogicalOperator: "AND",
           RightOperand: {
              Property: "ContentType", 
              SimpleOperator: "equals", 
              Value: 'queryactivity'
           }
        };
        data = prox.retrieve("DataFolder", cols, filter);
        
        cols = [ "Name","ContentType","ID","CustomerKey"];
        filter = {
           LeftOperand: {
              Property: "ParentFolder.ID", 
              SimpleOperator: "equals", 
              Value: parentFolderID
           },
           LogicalOperator: "AND",
           RightOperand: {
              Property: "ContentType", 
              SimpleOperator: "equals", 
              Value: 'queryactivity'
           }
        };
        parentData = prox.retrieve("DataFolder", cols, filter);
        
        debug(checkIfFolderExist(parentData.Results[0].ID,"english","queryactivity"));
        
        var config = {
          "Name": "english",
          "Description": "english",
          "ParentFolderID": parentData.Results[0].ID,
          "ContentType": "queryactivity",
          "IsActive" : "true",
          "IsEditable" : "true",
          "AllowChildren" : "true"
        };
        debug(config);
        // var createResult = Folder.Add(config);
       
        var queryFolder = Folder.Retrieve({Property:"ContentType",SimpleOperator:"equals",Value:"queryactivity"});
        debug(queryFolder);
        
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
        if(!folderID && !folderName)
        {
            return null;
        }
        elseif(!folderID)
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

    function checkIfFolderExist(parentFolderID,folderName,contentType){
        var parentFolders = getParentFolders(null,folderName,contentType);
        
        for(var i=0; i<parentFolders.length; i++)
        {
            if(parentFolders[i].ParentFolder.ID == parentFolderID)
            {
                return parentFolders[i].ID;
            }
        }
        return null;
    }
</script>
