<script runat="server" language="javascript">
  Platform.Load("Core", "1.1.5");
  Platform.Function.ContentBlockByKey('email360-ssjs-lib');

  var prox = new Script.Util.WSProxy();
  
  try{
    debugMode = ['console'];

    var languages = Platform.Function.LookupRows('ENT.CA-520000847-ISG-Language',['LU'],['1']);
    debug(languages);
    var languageLength = languages.length;

    //var rootQueryActivityFolderID = getFolders(0,null,null,"queryactivity")[0].ID;
    //debug(rootQueryActivityFolderID);

    for(var i=0; i<languageLength; i++)
    {
      var languageKeyFolder = getFolders(313121,null,languages[i].LanguageKey,"queryactivity");
      debug(languageKeyFolder);
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

  function getFolders(parentFolderID, folderID, folderName, contentType)
  {
    var cols = ["ID","Name","ParentFolder.ID"];
    var filter = null;
    var contentTypeOperand = getOperand("ContentType","equals",contentType);
    var parentFolderIDOperand = getOperand("ParentFolder.ID","equals",parentFolderID);
    var folderIDOperand = getOperand("ID","equals",folderID);
    var folderNameOperand = getOperand("Name","equals",folderName);
    if(parentFolderID != null)
    {
      if(folderID == null && folderName == null)
      {
        filter = getFilter(contentTypeOperand,'AND',parentFolderIDOperand);
      }
      else if(folderID != null || folderName != null)
      {
        if(folderID != null && folderName == null)
        {
          var folderIDRightOperand = getFilter(parentFolderIDOperand,'AND',folderIDOperand);
          filter = getFilter(contentTypeOperand,'AND',folderIDRightOperand);
        }
        else if(folderID == null && folderName != null)
        {
          var folderNameRightOperand = getFilter(parentFolderIDOperand,'AND',folderNameOperand);
          filter = getFilter(contentTypeOperand,'AND',folderNameRightOperand);
        }
        else
        {
          var folderIDNameOperand = getFilter(folderIDOperand,'AND',folderNameOperand);
          var folderParentIDRightOperand = getFilter(parentFolderIDOperand,'AND',folderIDNameOperand);
          filter = getFilter(contentTypeOperand,'AND',folderParentIDRightOperand);
        }
      }
    }
    else if(folderID != null)
    {
      if(folderName == null)
      {
        filter = getFilter(contentTypeOperand,'AND',folderIDOperand);
      }
      else
      {
        var folderIDNameOperand = getFilter(folderIDOperand,'AND',folderNameOperand);
        filter = getFilter(contentTypeOperand,'AND',folderIDNameOperand);
      }
    }
    else if(folderName != null)
    {
      filter = getFilter(contentTypeOperand,'AND',folderNameOperand);
    }
    else
    {
      return null;
    }
    debug(filter);
    var data = prox.retrieve("DataFolder", cols, filter);
    return data.Results;
  }
  
  function getOperand(property,simpleOperator,value)
  {
    var operand = {
      Property: property,
      SimpleOperator: simpleOperator,
      Value: value
    };
    return operand;
  }
  
  function getFilter(leftOperand,logicalOperator,rightOperand)
  {
    var filter = {
      LeftOperand: leftOperand,
      LogicalOperator: logicalOperator,
      RightOperand: rightOperand
    };
    return filter;
  }

</script>
