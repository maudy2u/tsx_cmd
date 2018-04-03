// ZWO ASI-183 Version - New Focus Offset Calculator
//
// This has values used for my QSI camera. They may not be appliable to your camera. You will almost certainly 
// have to change the exposure values. Read the comments throught the script.
//
// Uses @Focus2 to repeatedly focus through your filters and builds an offset table.
// Please be patient and watch the camera & focuser tabs to monitor progress.
//
// Use the offsets printed in the Javascript environment output box, and not the 
// offsets shown in the @Focus2 offset table on the focuser tab.
//
//
// Ken Sturrock
// January 13, 2018
//

/*

	Please set the two values immediately below ("baseFilter" and "howManyFilters").

	Next, go down to the section that starts with "function adjExposure()" and double check the names of the filters
	and set the correct exposure times for each filter.

	You may have to empirically find those values by running @Focus2 on each filter with different exposure values until 
	you find the exposure duration that works for each filter. On the other hand, you may be able to guess or
	reuse values for all the LRGB filters.
*/


// Change these values as appropriate.
//

var baseFilter = 0;		// This is your zero-offset base filter, probably luminance. It is the
				// filter that is used for comparison and should be the same as whatever
				// you usually use for focusing the system.	
				// Remember that the first filter in the wheel is 0 (zero), not 1 (one).
		
var howManyFilters = 5;		// How many filters in the wheel? This does not mean the number of slots
				// in the wheel, just the number of actual filters that you want to test
				// with the assumption that any empty slots are at the end.



// Leave these values alone
//
var filter = 0;
var counter;
var filNumb;
var filTemp;
var filPosi;
var filName;
var filPosiSum = 0;
var basePosiSum = 0;
var tempSum = 0;
var firstTempAvg = 0;
var lastTempAvg = 0;
var firstBaseAvg = 0;
var lastBaseAvg = 0;
var offset = 0;
var totalPosChange = 0;
var totalTempChange = 0;
var tempSlope = 0;

var initialAF2Exp = ccdsoftCamera.PropDbl("m_daf2CalibrationExposureTime");

if (ccdsoftCamera.PropStr("m_csObserver") == "Ken Sturrock")
//
// Do some custom stuff. If your name also happens to be "Ken Sturrock", modify as appropriate
//
{
	var initialCamDelay = ccdsoftCamera.Delay;	// What delay does the camera curently use?

	ccdsoftCamera.Delay = 0.25;			// Switch it to something shorter for repeated focusing.
}

RunJavaScriptOutput.writeLine ("---------------------------------------");
RunJavaScriptOutput.writeLine ("Filter" + "\t" + "Temp." + "\t" + "Focuser Pos.");
RunJavaScriptOutput.writeLine ("------" + "\t" + "-----" + "\t" + "------------");

function adjExposure()
//
//	Set the exposure for @Focus2 for each filter.
//
//	In the section below, the filter name in quotes (e.g. "Red") MUST exactly match the name of
//	the filter. So, make sure that there is an "if {}" structure for each filter in the system
//	and that the name is correct.
//
//	Next, verify that the number in quotes (e.g. "1.5", "1", "20", etc) matches the @Focus2 exposure 
//	value that you use for that particular filter. In other words make sure that the value between
//	quotes is whatever value works for @Focus2 in the "Exposure Time..." field found at the bottom
//	of the @Focus2 dialog box.
//
//	If you do not use all of the filters below, it's OK. Just make sure that there is an entry for
//	each filter that you DO use.
//
{
	if ( filName == "Red" )
	{
		ccdsoftCamera.setPropDbl("m_daf2CalibrationExposureTime", "0.02");
	} 

	if ( filName == "Green" )
	{
		ccdsoftCamera.setPropDbl("m_daf2CalibrationExposureTime", "0.02");

	} 

	if ( filName == "Blue" )
	{
		ccdsoftCamera.setPropDbl("m_daf2CalibrationExposureTime", "0.02");
	} 

	if ( filName == "IDAS" )
	{
		ccdsoftCamera.setPropDbl("m_daf2CalibrationExposureTime", "0.01");
	} 

	if ( filName == "Ha" )
	{
		ccdsoftCamera.setPropDbl("m_daf2CalibrationExposureTime", "1");
	} 

	if ( filName == "S-II" )
	{
		ccdsoftCamera.setPropDbl("m_daf2CalibrationExposureTime", "1");
	} 

	if ( filName == "O-III" )
	{
		ccdsoftCamera.setPropDbl("m_daf2CalibrationExposureTime", "1");
	} 

	if ( filName == "Clear" )
	{
	
		ccdsoftCamera.setPropDbl("m_daf2CalibrationExposureTime", "0.01");
	
	} 
}

function prettyPrint()
//
//	Print the statistics for each filter focus attempt
//
{
		filTemp = ccdsoftCamera.focTemperature;
		filPosi = ccdsoftCamera.focPosition;

		RunJavaScriptOutput.writeLine (filName + "\t" + filTemp + "\t" + filPosi);
}

//
//	Start main program
//

ccdsoftCamera.focConnect();

while ( filter < howManyFilters )
{
	if (filter !== baseFilter)
	//
	// Do not run this on the base filter, we don't need to compare it to itself.
	//
	{

		counter = 1;

		while ( counter < 4 )
		//
		// This just cycles through each filter several times to further compensate for seeing.
		//
		// You can change the number above to choose a different number of iterations.
		//
		{
			//Do Base Filter
			ccdsoftCamera.FilterIndexZeroBased = baseFilter;	
			filNumb = ccdsoftCamera.FilterIndexZeroBased;
			filName = ccdsoftCamera.szFilterName(filNumb);

			adjExposure();

			ccdsoftCamera.AtFocus()
	
			prettyPrint();
			basePosiSum = basePosiSum + filPosi;
			tempSum = tempSum + filTemp;

			sky6Web.Sleep (500); 

			//Do Target Filter
			ccdsoftCamera.FilterIndexZeroBased = filter;	
			filNumb = ccdsoftCamera.FilterIndexZeroBased;
			filName = ccdsoftCamera.szFilterName(filNumb);

			adjExposure();

			ccdsoftCamera.AtFocus()

			prettyPrint();
			filPosiSum = filPosiSum + filPosi;

			counter++

			sky6Web.Sleep (500);

		}

		//Do Final Base Filter to even out temperature
		ccdsoftCamera.FilterIndexZeroBased = baseFilter;	
		filNumb = ccdsoftCamera.FilterIndexZeroBased;
		filName = ccdsoftCamera.szFilterName(filNumb);

		adjExposure();

		ccdsoftCamera.AtFocus()
	
		prettyPrint();
		basePosiSum = basePosiSum + filPosi;
		tempSum = tempSum + filTemp;

		filPosiSum = filPosiSum / (counter - 1);	
		basePosiSum = basePosiSum / counter;
		tempSum = tempSum / counter;
	
		offset = filPosiSum - basePosiSum;
	
		RunJavaScriptOutput.writeLine ("---------------------------------------");
		RunJavaScriptOutput.writeLine (" Offset: " + offset.toFixed(0));
		RunJavaScriptOutput.writeLine ("---------------------------------------");


		// Add to tally for thermal slope calculation, reported at end
		//
		if ( filter == 1 )
		{
			firstBaseAvg = basePosiSum;
			firstTempAvg = tempSum;
		}

		if ( filter == ( howManyFilters - 1))
		{
			lastBaseAvg = basePosiSum;
			lastTempAvg = tempSum;
		}

		filPosiSum = 0;
		basePosiSum = 0;
		tempSum = 0;
	}

	filter++

}


if (ccdsoftCamera.PropStr("m_csObserver") == "Ken Sturrock")
//
// Do some custom stuff. If your name also happens to be "Ken Sturrock", modify as appropriate
//
{
	ccdsoftCamera.Delay = initialCamDelay;	// Return camera delay to whatever it was.
}


RunJavaScriptOutput.writeLine ("---------------------------------------");

totalPosChange = firstBaseAvg - lastBaseAvg;
totalTempChange = firstTempAvg - lastTempAvg;

tempSlope = totalPosChange / totalTempChange;

if ( totalTempChange > 1 )
{
	RunJavaScriptOutput.writeLine (" Calculated Thermal Slope " + tempSlope.toFixed(0));
} else {
	RunJavaScriptOutput.writeLine (" WARNING - MINIMAL CHANGE OR TEMPERATURE ROSE");
	RunJavaScriptOutput.writeLine (" Calculated Thermal Slope " + tempSlope.toFixed(0));
}

RunJavaScriptOutput.writeLine ("---------------------------------------");
RunJavaScriptOutput.writeLine ("Finished Run" );
RunJavaScriptOutput.writeLine ("---------------------------------------");

ccdsoftCamera.setPropDbl("m_daf2CalibrationExposureTime", initialAF2Exp);





