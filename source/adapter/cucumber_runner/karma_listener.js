(function (global) {
  var KarmaListener = function KarmaListener(karma) {
    var self = {
      currentStep: null,
      currentScenario: null,
      currentFeature: null,
      scenarioSuccess: true,
      scenarioSkipped: false,
      scenarioLog: {},
      totalSteps: 0,
      eventMap: null,

      hear: function hear(event, callback) {
        if (!self.eventMap) {
          self.eventMap = {
            'BeforeFeature': self.beforeFeature,
            'BeforeScenario': self.beforeScenario,
            'BeforeStep': self.beforeStep,
            'StepResult': self.stepResult
          };
        }

        var eventName = event.getName();

        // Some event names are not handled, those throw
        try {
          self.eventMap[eventName](event);
        } catch (e) {}

        callback();
      },

      beforeFeature: function beforeFeature(event) {
        self.currentFeature = event.getPayloadItem('feature');
      },

      beforeScenario: function beforeScenario(event) {
        self.currentScenario = event.getPayloadItem('scenario');
        self.currentScenario._time = new Date().getTime();
      },

      beforeStep: function beforeStep(event) {
        self.currentStep = event.getPayloadItem('step');
        if (!self.scenarioLog[self.currentStep.getName()]) {
          self.scenarioLog[self.currentStep.getName()] = [];
        }
      },

      stepResult: function stepResult(event) {
        self.totalSteps++;
        karma.info({total: self.totalSteps});

        var result = event.getPayloadItem('stepResult');
        var stepSuccessful = self.checkStepSuccess(result);
        var stepSkipped = self.checkStepSkipped(result);

        self.checkStepFailure(result);

        var currentScenarioName = self.currentScenario.getName();
        var currentFeatureName = self.currentFeature.getName();
        var timeElapsed = self.getScenarioTimeElapsed(stepSkipped);

        var log = [];

        for (var stepName in self.scenarioLog) {
          var errorLog = self.scenarioLog[stepName];
          if (errorLog.length) {
            log.push(stepName + '\n' + errorLog.join('\n\n'));
          }
        }

        karma.result({
          description: currentScenarioName,
          log: log,
          suite: [currentFeatureName],
          success: stepSuccessful,
          skipped: stepSkipped,
          time: timeElapsed,
          netTime: timeElapsed
        });
      },

      checkStepSuccess: function checkStepSuccess(stepResult) {
        return self.scenarioSuccess && stepResult.isSuccessful();
      },

      checkStepSkipped: function checkStepSkipped(stepResult) {
        return stepResult.isSkipped();
      },

      checkStepFailure: function checkStepFailure(stepResult) {
        if (!stepResult.isSuccessful() &&
          !stepResult.isPending() &&
          !stepResult.isUndefined() &&
          !stepResult.isSkipped()) {
          var error = stepResult.getFailureException();
          var currentStepName = self.currentStep.getName();

          var errorLog = "";
          if (error.stack) {
            errorLog = error.stack;
          } else {
            errorLog = error;
          }

          self.scenarioLog[currentStepName].push(''+errorLog);
        }
      },

      getScenarioTimeElapsed: function getScenarioTimeElapsed(scenarioSkippedStatus) {
        var timeElapsed;
        if (scenarioSkippedStatus) {
          timeElapsed = 0;
        } else {
          timeElapsed = new Date().getTime() - self.currentScenario._time;
        }

        return timeElapsed;
      },

      toString: function toString() {
        return '[object KarmaListener]';
      }
    };

    return self;
  };

  define([], function () {
    return KarmaListener;
  });
}(window));