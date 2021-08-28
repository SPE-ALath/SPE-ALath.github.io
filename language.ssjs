<script runat="server" language="javascript">
  Platform.Load("Core", "1.1.5");
  Platform.Function.ContentBlockByKey('email360-ssjs-lib');

  var prox = new Script.Util.WSProxy();
  
  try{
    debugMode = ['console'];
    
    var namePrefix = "user";
    var rootDEExternalKey = "source_user";
    var rootDEName = "source_user";
    var rootDENameFields = "SubscriberKey,EmailAddress,FirstName,LastName,BirthDate,Gender,Zip,CreatedDate,ModifiedDate";
    
    var usedForSendingFolderName = "_USED-FOR-SENDING";
    
    var contentTypeDE = "dataextension";
    var contentTypeQuery = "queryactivity";
    var queryFolderID = "queryFolderID";
    var queryFolderName = "queryFolderName";
    var deFolderID = "deFolderID";
    var deFolderName = "deFolderName";
    var folderIDArr = {};
    
    
    // FETCH : ROOT FOLDER : ID : QUERY ACTIVITY : TO CREATE CHILD OBJECTS
    var rootQueryActivityFolderID = getFolders(0,null,null,contentTypeQuery)[0].ID;
    var rootQueryActivityFolderName = getFolders(0,null,null,contentTypeQuery)[0].Name;
    folderIDArr["root>"+queryFolderID] = rootQueryActivityFolderID;
    folderIDArr["root>"+queryFolderName] = rootQueryActivityFolderName;
    
    // FETCH : ROOT FOLDER : ID : DATA EXTENSION : TO CREATE CHILD OBJECTS
    var rootDEActivityFolderID = getFolders(0,null,null,contentTypeDE)[0].ID;
    var rootDEActivityFolderName = getFolders(0,null,null,contentTypeDE)[0].Name;
    folderIDArr["root>"+deFolderID] = rootDEActivityFolderID;
    folderIDArr["root>"+deFolderName] = rootDEActivityFolderName;
    
    
    //cloneDataExtension(rootDEExternalKey,namePrefix+"Test",rootDEActivityFolderID);
    
    
    // CREATE : SUB FOLDER : usedForSendingFolderName : EXISTING ROOT FOR MARKETING USER
    var usedForSendingDEFolderID = createFolderIfNotExist(rootDEActivityFolderID,usedForSendingFolderName,contentTypeDE);
    var usedForSendingQueryFolderID = createFolderIfNotExist(rootQueryActivityFolderID,usedForSendingFolderName,contentTypeQuery);
    
    // CREATE : SUB FOLDER : namePrefix : TO ACT AS ROOT FOLDER FOR AUTO GENERATED CHILD OBJECTS
    var namePrefixDEFolderID = createFolderIfNotExist(usedForSendingDEFolderID,namePrefix,contentTypeDE);
    var namePrefixQueryFolderID = createFolderIfNotExist(usedForSendingQueryFolderID,namePrefix,contentTypeQuery);

    var namePrefixDECustomerKey = cloneDataExtensionIfNotExist(null,namePrefix,rootDEExternalKey,namePrefix,namePrefixDEFolderID);
    var namePrefixQuery = "select * from ["+rootDEName+"]";
    var namePrefixDEQuery = createQueryActivity(namePrefix,namePrefixQuery,namePrefix,namePrefixDECustomerKey,"Overwrite",namePrefixQueryFolderID);
    
    // FETCH : LANGUAGE ENTITY : TO CREATE CHILD OBJECTS FOR EACH LANGUAGE : SUB FOLDER|DATA EXTENSION|QUERY ACTIVITY|AUTOMATION
    var languages = Platform.Function.LookupRows('ENT.CA-520000847-ISG-Language',['LU'],['1']);
    var languageLength = languages.length;

    for(var i=0; i<languageLength; i++)
    {
      var languageDEKeyFolderID = createFolderIfNotExist(namePrefixDEFolderID,languages[i].LanguageKey,contentTypeDE);
      var languageQueryKeyFolderID = createFolderIfNotExist(namePrefixQueryFolderID,languages[i].LanguageKey,contentTypeQuery);
      
      var languageName = namePrefix + "_l~"+languages[i].LanguageKey;
      
      var languageDECustomerKey = cloneDataExtensionIfNotExist(null,languageName,rootDEExternalKey,languageName,languageDEKeyFolderID);
      var languageQuery = "select "+rootDENameFields+" from ["+rootDEName+"] where SubscriberKey in (select SubscriberKey from ent.[CA-520000847-ISG-User_Language] where LanguageID = '" + languages[i].LanguageID + "')";
      if(languages[i].LanguageKey != "english")
      {
        languageQuery = "select "+rootDENameFields+" from ["+rootDEName+"] where SubscriberKey in (select SubscriberKey from ent.[CA-520000847-ISG-User_Language] where LanguageID = '" + languages[i].LanguageID + "') and SubscriberKey not in (select SubscriberKey from ent.[CA-520000847-ISG-User_Language] where LanguageID = 1)";
      }
      var languageDEQuery = createQueryActivity(languageName,languageQuery,languageName,languageDECustomerKey,"Overwrite",languageQueryKeyFolderID);

    }
    debug(folderIDArr);
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
  
  function createQueryActivity(name,query,deName,deCustomerKey,targetUpdateType,folderID)
  {
    var config = {
      Name: name,
      CustomerKey: Platform.Function.GUID(),
      TargetUpdateType: targetUpdateType,
      TargetType: "DE",
      DataExtensionTarget : {
        Name: deName,
        CustomerKey: deCustomerKey
      },
      QueryText: query,
      CategoryID: folderID
    };
    debug(config);
    var createResult=prox.createItem("QueryDefinition",config);
    debug(createResult);
    return createResult;
  }
  
  function cloneDataExtensionIfNotExist(customerKey,name,cloneCustomerKey,targetDEName,folderID)
  {
    var dataExtension = getDataExtensions(customerKey,name,folderID);
    var dataExtensionCustomerKey = null;
    if(dataExtension.length == 0)
    {
      var isDataExtensionCreated = cloneDataExtension(cloneCustomerKey,targetDEName,folderID);
      dataExtensionCustomerKey = getDataExtensions(customerKey,name,folderID)[0].CustomerKey;
    }
    else
    {
      dataExtensionCustomerKey = dataExtension[0].CustomerKey;
      debug(dataExtension);
    }
    debug(dataExtensionCustomerKey);
    return dataExtensionCustomerKey;
  }
  
  function getDataExtensions(customerKey,name,categoryID)
  {
    var cols = ["CustomerKey","Name","CategoryID"];
    var filter = null;
    var categoryIDOperand = getOperand("CategoryID","equals",categoryID);
    var customerKeyOperand = getOperand("CustomerKey","equals",customerKey);
    var nameOperand = getOperand("Name","equals",name);
    
    if(categoryIDOperand != null)
    {
      if(customerKey == null && name == null)
      {
        filter = categoryIDOperand;
      }
      else if(customerKey != null && name == null)
      {
        filter = getFilter(categoryIDOperand,'AND',customerKeyOperand);
      }
      else if(customerKey == null && name != null)
      {
        filter = getFilter(categoryIDOperand,'AND',nameOperand);
      }
      else
      {
        var customerKeyNameOperand = getFilter(customerKeyOperand,'AND',nameOperand);
        filter = getFilter(categoryIDOperand,'AND',customerKeyNameOperand);
      }
    }
    else if(customerKey != null)
    {
      if(name == null)
      {
        filter = customerKeyOperand;
      }
      else
      {
        filter = getFilter(customerKeyOperand,'AND',nameOperand);
      }
    }
    else if(name != null)
    {
      filter = nameOperand;
    }
    else
    {
      return null;
    }
    
    var data = prox.retrieve("DataExtension", cols, filter);
    return data.Results;
  }
  
  function createFolderIfNotExist(parentFolderID,folderName,contentType)
  {
    var folder = getFolders(parentFolderID,null,folderName,contentType);
    var folderID = null;
    if(folder.length == 0)
    {
      var isFolderCreated = createFolder(folderName,parentFolderID,contentType);
      folderID = getFolders(parentFolderID,null,folderName,contentType)[0].ID;
    }
    else
    {
      folderID = folder[0].ID;
    }
    return folderID;
  }
    
  function createFolder(name,parentFolderID,contentType)
  {
    var config = {
      "Name": name,
      "Description": name,
      "ParentFolderID": parentFolderID,
      "ContentType": contentType,
      "IsActive" : "true",
      "IsEditable" : "true",
      "AllowChildren" : "true"
    };
    var createResult = Folder.Add(config);
    return createResult;
  }
  
  function cloneDataExtension(customerKey,targetDEName,folderID)
  {
    var cols = ["Name","CustomerKey","CategoryID","IsSendable","SendableDataExtensionField.Name", "SendableSubscriberField.Name", "DataRetentionPeriodLength", "DataRetentionPeriod", "DeleteAtEndOfRetentionPeriod", "RowBasedRetention", "ResetRetentionPeriodOnImport"];
    var filter = {
      Property: "CustomerKey",
      SimpleOperator: "equals",
      Value: customerKey
    };
    var desc = prox.retrieve("DataExtension", cols, filter);
    debug(desc);
    var sendable = desc.Results[0].IsSendable;
    var retention = desc.Results[0].DataRetentionPeriodLength;

    if (retention && retention > 0) { 
      retention = true  
      Write('Retention: ' + retention + '<br><br>')
    }
    var DEcategoryID = desc.Results[0].CategoryID;
    
    if(sendable) {
      var sendableName = desc.Results[0].SendableDataExtensionField.Name;
      var RelatesOnSub = desc.Results[0].SendableSubscriberField.Name;
    }

    if (retention) {
      var retentionPeriodLength = desc.Results[0].DataRetentionPeriodLength;
      var retentionPeriod = desc.Results[0].DataRetentionPeriod;
      var deleteRetentionPeriod = desc.Results[0].DeleteAtEndOfRetentionPeriod;
      var rowRetention = desc.Results[0].RowBasedRetention;
      var resetRetention = desc.Results[0].ResetRetentionPeriodOnImport;
      var retentionPeriodUnit = desc.Results[0].DataRetentionPeriodUnitOfMeasure;
    }

    // Retrieve DE Field Schema
    var cols2 = ["CustomerKey","Name","FieldType","IsPrimaryKey","MaxLength","Ordinal","DefaultValue","IsRequired"];
    var filter2 = {
      Property: "DataExtension.CustomerKey",
      SimpleOperator: "equals",
      Value: customerKey
    };
    var deFields = prox.retrieve("DataExtensionField", cols2, filter2);

    var fieldLength = deFields.Results.length
    var deFieldObj = deFields.Results

    var fieldArray = []

    // Organize and format DE Field Schema
    for (var a = 0; a < deFieldObj.length; a++) {

      var fieldObj = deFields.Results[a]

      //Fields that need to be removed prior to creation of new DE
      delete fieldObj.AttributeMaps;
      delete fieldObj.CustomerKey;
      delete fieldObj.ObjectID;
      if (fieldObj.MaxLength == "" || fieldObj.MaxLength == 0) {
        delete fieldObj.MaxLength;
      }
      delete fieldObj.StorageType;
      delete fieldObj.DataExtension;
      delete fieldObj.DataType;
      delete fieldObj.IsCreatable;
      delete fieldObj.IsUpdatable;
      delete fieldObj.IsRetrievable;
      delete fieldObj.IsQueryable;
      delete fieldObj.IsFilterable;
      delete fieldObj.IsPartnerProperty;
      delete fieldObj.IsAccountProperty;
      delete fieldObj.PartnerMap;
      delete fieldObj.Markups;
      delete fieldObj.Precision;
      delete fieldObj.Scale;
      delete fieldObj.Label;
      if (fieldObj.MinLength == "" || fieldObj.MinLength == 0) {
        delete fieldObj.MinLength;
      }
      delete fieldObj.CreatedDate;
      delete fieldObj.ModifiedDate;
      delete fieldObj.ID;
      delete fieldObj.IsRestrictedPicklist;
      delete fieldObj.PicklistItems;
      delete fieldObj.IsSendTime;
      delete fieldObj.DisplayOrder;
      delete fieldObj.References;
      delete fieldObj.RelationshipName;
      delete fieldObj.Status;
      delete fieldObj.IsContextSpecific;
      delete fieldObj.Client;
      delete fieldObj.PartnerProperties;

      fieldArray.push(fieldObj);

      //set sendable field type
      if(sendableName == fieldObj.Name) {
        var sendableFieldType = fieldObj.FieldType
        }

      //Reset fieldObj
      var fieldObj = "";

    }
    
    // Create New DE
    var name = targetDEName;
    var de = {
      Name: name,
      CustomerKey: Platform.Function.GUID(),
      Description: "",
      Fields: fieldArray,
      CategoryID: DEcategoryID
    };

    if(sendable) {

      if (RelatesOnSub = '_SubscriberKey') { 
        RelatesOnSub = 'Subscriber Key' 
      }
      de.IsSendable = true
      de.SendableDataExtensionField = {"Name": sendableName, "FieldType": sendableFieldType }
      de.SendableSubscriberField = {"Name": RelatesOnSub}
      de.CategoryID = folderID

    }

    if (retention) {

      de.DataRetentionPeriodLength = retentionPeriodLength;
      de.DataRetentionPeriod = retentionPeriod;
      de.DeleteAtEndOfRetentionPeriod = deleteRetentionPeriod;
      de.RowBasedRetention = rowRetention;
      de.ResetRetentionPeriodOnImport = resetRetention;
      de.DataRetentionPeriodUnitOfMeasure = retentionPeriodUnit;
    }
    
    de.Fields.sort(function(a, b) {
      return a.Ordinal < b.Ordinal ? -1 : 1
    });
    
    var res = prox.createItem("DataExtension", de);
    debug(res);
    return res;
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
